using DeviceManagement.API.Data;
using DeviceManagement.API.Interfaces;
using DeviceManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DeviceManagement.API.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;
    public UserRepository(AppDbContext db) => _db = db;

    public async Task<IEnumerable<User>> GetAllAsync() =>
        await _db.Users.ToListAsync();

    public async Task<User?> GetByIdAsync(int id) =>
        await _db.Users.FindAsync(id);

    public async Task<User?> GetByEmailAsync(string email) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<User> CreateAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }
}