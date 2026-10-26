-- Para una BD que YA existe (no hace falta recrearla). Se puede correr más de una vez.
USE CarWashDB;
GO
IF NOT EXISTS (SELECT 1 FROM Usuario WHERE NombreUsuario = 'operador')
    INSERT INTO Usuario (Nombre, Apellido, Email, NombreUsuario, Contrasena, CodRol)
    VALUES ('Lucia', 'Operadora', 'operador@carwash.com', 'operador',
        '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
        (SELECT CodRol FROM Roles WHERE NombreRol = 'Operador'));
GO
