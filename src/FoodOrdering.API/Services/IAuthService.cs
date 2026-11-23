using FoodOrdering.API.Models.DTOs;

namespace FoodOrdering.API.Services
{
    public interface IAuthService
    {
        Task<AuthResultDto> RegisterAsync(RegisterDto dto);
        Task<AuthResultDto> LoginAsync(LoginDto dto);
        Task<string> ForgotPasswordAsync(ForgotPasswordDto dto);
        Task<string> ResetPasswordAsync(ResetPasswordDto dto);
    }
}
