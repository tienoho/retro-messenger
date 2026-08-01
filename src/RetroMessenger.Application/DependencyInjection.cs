using Microsoft.Extensions.DependencyInjection;
using RetroMessenger.Application.Contacts;
using RetroMessenger.Application.Admin;
using RetroMessenger.Application.Identity;
using RetroMessenger.Application.Media;
using RetroMessenger.Application.Messaging;
using RetroMessenger.Application.Rooms;
using RetroMessenger.Application.Users;

namespace RetroMessenger.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddRetroMessengerApplication(this IServiceCollection services)
    {
        services.AddScoped<SendMessageService>();
        services.AddScoped<BuzzService>();
        services.AddScoped<UserService>();
        services.AddScoped<ContactService>();
        services.AddScoped<RoomService>();
        services.AddScoped<MediaStorageService>();
        services.AddScoped<AuthService>();
        services.AddScoped<AdminService>();

        return services;
    }
}
