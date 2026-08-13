namespace LocalCart.Product.Application.Common.Exceptions;

public sealed class NotFoundException(string message) : Exception(message);

public sealed class ConflictException(string message, Exception? innerException = null) : Exception(message, innerException);

public sealed class ForbiddenException(string message) : Exception(message);
