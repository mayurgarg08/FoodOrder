using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FoodOrdering.API.Models.DTOs;
using FoodOrdering.API.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace FoodOrdering.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        public async Task<AuthResultDto> RegisterAsync(RegisterDto dto)
        {
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                throw new InvalidOperationException("A user with this email already exists.");
            }

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                Address = dto.Address,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Registration failed: {errors}");
            }

            await _userManager.AddToRoleAsync(user, "Customer");

            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwtToken(user, roles);

            return new AuthResultDto
            {
                Token = token,
                Role = roles.First(),
                FullName = user.FullName,
                Email = user.Email!,
                ExpiresAt = DateTime.UtcNow.AddMinutes(GetTokenExpiryMinutes())
            };
        }

        public async Task<AuthResultDto> LoginAsync(LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            {
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwtToken(user, roles);

            return new AuthResultDto
            {
                Token = token,
                Role = roles.FirstOrDefault() ?? "Customer",
                FullName = user.FullName,
                Email = user.Email!,
                ExpiresAt = DateTime.UtcNow.AddMinutes(GetTokenExpiryMinutes())
            };
        }

        public async Task<string> ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                // Return success even if user not found to prevent email enumeration
                return "If an account with that email exists, a password reset link has been sent.";
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            // In production, send this token via email
            // For development, we log it
            Console.WriteLine($"[DEV] Password reset token for {dto.Email}: {token}");

            return "If an account with that email exists, a password reset link has been sent.";
        }

        public async Task<string> ResetPasswordAsync(ResetPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                throw new InvalidOperationException("Invalid reset request.");
            }

            var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Password reset failed: {errors}");
            }

            return "Password has been reset successfully.";
        }

        private string GenerateJwtToken(ApplicationUser user, IList<string> roles)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secret = jwtSettings["Secret"] ?? "default_dev_jwt_secret_key_32chars_minimum!!";

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };
            claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expiryMinutes = GetTokenExpiryMinutes();

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"] ?? "FoodOrderingAPI",
                audience: jwtSettings["Audience"] ?? "FoodOrderingClient",
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private int GetTokenExpiryMinutes()
        {
            var expiryStr = _configuration.GetSection("JwtSettings")["ExpiryMinutes"];
            return int.TryParse(expiryStr, out var minutes) ? minutes : 60;
        }
    }
}
