using System.Security.Cryptography;
using System.Text;

namespace LocalCart.Product.Application.Products;

internal static class ProductCacheKeys
{
    public const string ListRegion = "products:list";
    public const string Categories = "categories:all";

    public static string Detail(Guid id) => $"products:detail:{id:N}";

    public static string List(long version, string canonicalQuery)
    {
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonicalQuery))).ToLowerInvariant();
        return $"products:list:v{version}:{hash}";
    }
}
