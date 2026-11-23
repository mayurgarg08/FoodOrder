using System.Security.Claims;
using FoodOrdering.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FoodOrdering.API.Hubs;

[Authorize]
public sealed class OrderTrackingHub : Hub
{
    private readonly IOrderService _orderService;

    public OrderTrackingHub(IOrderService orderService)
    {
        _orderService = orderService;
    }

    public static string GroupName(int orderId) => $"order:{orderId}";

    public async Task JoinOrder(int orderId)
    {
        if (orderId <= 0)
            throw new HubException("Invalid order number.");

        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = Context.User?.IsInRole("Admin") == true;
        if (!isAdmin && string.IsNullOrWhiteSpace(userId))
            throw new HubException("You are not allowed to track this order.");

        var order = await _orderService.GetOrderByIdAsync(orderId, isAdmin ? null : userId);
        if (order == null)
            throw new HubException("You are not allowed to track this order.");

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(orderId));
    }
}
