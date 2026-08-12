namespace LocalCart.Auth.Application.Common.Exceptions;

public sealed class ConflictException(string message, Exception? innerException = null) : Exception(message, innerException);

public sealed class NotFoundException(string message) : Exception(message);

public sealed class AuthenticationException(string message) : Exception(message);
