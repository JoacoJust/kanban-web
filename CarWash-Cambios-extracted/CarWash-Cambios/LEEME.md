# Cambios aplicados

Copiá cada archivo sobre el de tu proyecto (mismas carpetas). Hay 2 archivos NUEVOS que ya están agregados
en los .csproj incluidos: BLL/Idioma/DiccionarioTextos.cs y GUI/FormBase.cs.
Si preferís no pisar los .csproj, agregá a mano:
  BLL.csproj : <Compile Include="Idioma\DiccionarioTextos.cs" />
  GUI.csproj : <Compile Include="FormBase.cs"><SubType>Form</SubType></Compile>

## 1. Bugs
- DAL/Login/UsuarioDAL.cs : RegistroBitacora -> Bitacora (eliminar usuario).
- DAL/BackupDAL.cs        : SqlConnection.ClearAllPools() tras el restore.
- BLL/BackupBLL.cs        : el registro en bitácora post-restore ya no muestra un error falso.
- GUI/FormBackup.cs       : tras restaurar, Application.Restart().

## 2. Permisos (CU13-16)
- BLL/SesionActual.cs : TienePermiso("NombreHoja") con cache + RecargarPermisos().
- GUI/Form1.cs        : se sacó el hack esAdmin; TODOS los botones del menú se rigen por el Composite.
- ScriptBD.sql        : usuario de prueba  operador / 1234  (rol Operador).
- Parche_Usuario_Operador.sql : lo mismo, para una BD que ya existe.

## 3. Idioma (CU03)
- GUI/FormBase.cs + BLL/Idioma/DiccionarioTextos.cs + IdiomaManager.TraducirTexto.
- Los 13 formularios ahora heredan de FormBase (cambio de una línea en cada uno).
