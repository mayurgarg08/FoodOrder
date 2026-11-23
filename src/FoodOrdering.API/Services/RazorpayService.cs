using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Net.Http.Json;
using FoodOrdering.API.Models.DTOs;
using FoodOrdering.API.Repositories;

namespace FoodOrdering.API.Services
{
    public class RazorpayService : IRazorpayService
    {
        private const string ApiBaseUrl = "https://api.razorpay.com/v1";
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ICartRepository _cartRepository;

        public RazorpayService(HttpClient httpClient, IConfiguration configuration, ICartRepository cartRepository)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _cartRepository = cartRepository;
        }

        public async Task<RazorpayOrderResponseDto> CreateOrderAsync(string userId)
        {
            var keys = GetKeys();
            var cart = (await _cartRepository.GetByUserIdAsync(userId)).ToList();
            if (cart.Count == 0)
                throw new InvalidOperationException("Your cart is empty.");

            var currency = GetCurrency();
            var amount = ToMinorUnits(CalculateGrandTotal(cart));
            var requestBody = new
            {
                amount,
                currency,
                receipt = $"food-{Guid.NewGuid():N}"[..29],
                notes = new Dictionary<string, string>
                {
                    ["app_user_id"] = userId,
                    ["cart_fingerprint"] = GetCartFingerprint(cart)
                }
            };

            using var request = CreateRequest(HttpMethod.Post, "orders", keys.KeyId, keys.KeySecret);
            request.Content = JsonContent.Create(requestBody);
            using var response = await _httpClient.SendAsync(request);
            using var document = await ReadResponseAsync(response);
            var root = document.RootElement;

            return new RazorpayOrderResponseDto
            {
                KeyId = keys.KeyId,
                OrderId = root.GetProperty("id").GetString() ?? string.Empty,
                Amount = root.GetProperty("amount").GetInt64(),
                Currency = root.GetProperty("currency").GetString() ?? currency
            };
        }

        public async Task<string> VerifyAndCapturePaymentAsync(string userId, VerifyRazorpayPaymentDto dto)
        {
            var keys = GetKeys();
            if (!IsSignatureValid(dto.RazorpayOrderId, dto.RazorpayPaymentId, dto.RazorpaySignature, keys.KeySecret))
                throw new InvalidOperationException("Razorpay payment signature is invalid.");

            using var orderRequest = CreateRequest(HttpMethod.Get, $"orders/{Uri.EscapeDataString(dto.RazorpayOrderId)}", keys.KeyId, keys.KeySecret);
            using var orderResponse = await _httpClient.SendAsync(orderRequest);
            using var orderDocument = await ReadResponseAsync(orderResponse);
            var razorpayOrder = orderDocument.RootElement;

            var orderUserId = razorpayOrder.GetProperty("notes").TryGetProperty("app_user_id", out var userIdElement)
                ? userIdElement.GetString()
                : null;
            if (orderUserId != userId)
                throw new InvalidOperationException("This Razorpay order does not belong to the current user.");

            var cart = (await _cartRepository.GetByUserIdAsync(userId)).ToList();
            if (cart.Count == 0)
                throw new InvalidOperationException("Your cart is empty. The payment cannot be attached to an order.");

            var currency = GetCurrency();
            var expectedAmount = ToMinorUnits(CalculateGrandTotal(cart));
            var notes = razorpayOrder.GetProperty("notes");
            var expectedFingerprint = GetCartFingerprint(cart);
            if (razorpayOrder.GetProperty("amount").GetInt64() != expectedAmount ||
                !string.Equals(razorpayOrder.GetProperty("currency").GetString(), currency, StringComparison.OrdinalIgnoreCase) ||
                !notes.TryGetProperty("cart_fingerprint", out var fingerprintElement) ||
                fingerprintElement.GetString() != expectedFingerprint)
                throw new InvalidOperationException("The paid amount no longer matches your cart. Contact support before retrying.");

            using var paymentRequest = CreateRequest(HttpMethod.Get, $"payments/{Uri.EscapeDataString(dto.RazorpayPaymentId)}", keys.KeyId, keys.KeySecret);
            using var paymentResponse = await _httpClient.SendAsync(paymentRequest);
            using var paymentDocument = await ReadResponseAsync(paymentResponse);
            var payment = paymentDocument.RootElement;

            if (payment.GetProperty("order_id").GetString() != dto.RazorpayOrderId ||
                payment.GetProperty("amount").GetInt64() != expectedAmount ||
                !string.Equals(payment.GetProperty("currency").GetString(), currency, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Razorpay payment details do not match this order.");

            var paymentStatus = payment.GetProperty("status").GetString();
            if (paymentStatus == "authorized")
            {
                using var captureRequest = CreateRequest(HttpMethod.Post,
                    $"payments/{Uri.EscapeDataString(dto.RazorpayPaymentId)}/capture", keys.KeyId, keys.KeySecret);
                captureRequest.Content = JsonContent.Create(new { amount = expectedAmount, currency });
                using var captureResponse = await _httpClient.SendAsync(captureRequest);
                using var captureDocument = await ReadResponseAsync(captureResponse);
                paymentStatus = captureDocument.RootElement.GetProperty("status").GetString();
            }

            if (paymentStatus != "captured")
                throw new InvalidOperationException("Razorpay has not captured this payment.");

            return dto.RazorpayPaymentId;
        }

        private (string KeyId, string KeySecret) GetKeys()
        {
            var keyId = _configuration["Razorpay:KeyId"];
            var keySecret = _configuration["Razorpay:KeySecret"];
            if (string.IsNullOrWhiteSpace(keyId) || string.IsNullOrWhiteSpace(keySecret))
                throw new InvalidOperationException("Razorpay test credentials are not configured on the API.");
            if (!keyId.StartsWith("rzp_test_", StringComparison.Ordinal))
                throw new InvalidOperationException("Only Razorpay Test Mode keys are accepted by this integration.");

            return (keyId, keySecret);
        }

        private string GetCurrency()
        {
            var currency = (_configuration["Razorpay:Currency"] ?? "INR").ToUpperInvariant();
            if (currency != "INR")
                throw new InvalidOperationException("Razorpay currency must be configured as INR.");
            return currency;
        }

        private static long ToMinorUnits(decimal amount) =>
            decimal.ToInt64(decimal.Round(amount * 100m, 0, MidpointRounding.AwayFromZero));

        private static decimal CalculateGrandTotal(IEnumerable<FoodOrdering.API.Models.Entities.CartItem> cartItems) =>
            cartItems.Sum(item => item.Food.Price * item.Quantity) +
            decimal.Round(cartItems.Sum(item => item.Food.Price * item.Quantity) * 0.10m, 0, MidpointRounding.AwayFromZero);

        private static string GetCartFingerprint(IEnumerable<FoodOrdering.API.Models.Entities.CartItem> cartItems)
        {
            var contents = string.Join("|", cartItems.OrderBy(item => item.FoodId)
                .Select(item => $"{item.FoodId}:{item.Quantity}:{item.Food.Price.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture)}"));
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(contents)));
        }

        private static bool IsSignatureValid(string orderId, string paymentId, string signature, string secret)
        {
            try
            {
                using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
                var expected = hmac.ComputeHash(Encoding.UTF8.GetBytes($"{orderId}|{paymentId}"));
                var supplied = Convert.FromHexString(signature);
                return supplied.Length == expected.Length && CryptographicOperations.FixedTimeEquals(supplied, expected);
            }
            catch (FormatException)
            {
                return false;
            }
        }

        private static HttpRequestMessage CreateRequest(HttpMethod method, string path, string keyId, string keySecret)
        {
            var request = new HttpRequestMessage(method, $"{ApiBaseUrl}/{path}");
            var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{keyId}:{keySecret}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
            return request;
        }

        private static async Task<JsonDocument> ReadResponseAsync(HttpResponseMessage response)
        {
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                var message = "Razorpay request failed.";
                try
                {
                    using var errorDocument = JsonDocument.Parse(body);
                    if (errorDocument.RootElement.TryGetProperty("error", out var error) &&
                        error.TryGetProperty("description", out var description))
                        message = description.GetString() ?? message;
                }
                catch (JsonException) { }

                throw new InvalidOperationException(message);
            }

            return JsonDocument.Parse(body);
        }
    }
}
