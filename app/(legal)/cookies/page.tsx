export const metadata = {
  title: "Política de Cookies | Jean Monnet",
};

export default function Cookies() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Política de Cookies</h1>
      <p className="text-muted-foreground text-sm">Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</p>

      <p>
        En cumplimiento del artículo 22.2 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), y de la Directiva 2009/136/CE, le informamos sobre el uso de cookies en la Plataforma Jean Monnet.
      </p>

      <h2>¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños ficheros de texto que los sitios web almacenan en el dispositivo del usuario cuando este los visita. Permiten que el sitio recuerde información sobre su visita, lo que facilita la navegación y hace que la Plataforma sea más útil.
      </p>

      <h2>Cookies que utilizamos</h2>

      <h3>Cookies estrictamente necesarias (no requieren consentimiento)</h3>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Proveedor</th>
            <th>Finalidad</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>better-auth.session_token</code></td>
            <td>Jean Monnet</td>
            <td>Mantener la sesión del usuario autenticado</td>
            <td>7 días</td>
          </tr>
          <tr>
            <td><code>better-auth.csrf_token</code></td>
            <td>Jean Monnet</td>
            <td>Protección contra ataques CSRF</td>
            <td>Sesión</td>
          </tr>
          <tr>
            <td><code>cookie-consent</code></td>
            <td>Jean Monnet</td>
            <td>Guarda las preferencias de consentimiento de cookies</td>
            <td>1 año</td>
          </tr>
        </tbody>
      </table>

      <h3>Cookies de preferencias (requieren consentimiento)</h3>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Proveedor</th>
            <th>Finalidad</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>theme</code></td>
            <td>Jean Monnet</td>
            <td>Recuerda la preferencia de tema claro/oscuro</td>
            <td>1 año</td>
          </tr>
        </tbody>
      </table>

      <h2>Cómo gestionar las cookies</h2>
      <p>
        Puede configurar su navegador para rechazar todas las cookies o para que le avise cuando se envíe una cookie. Sin embargo, si rechaza las cookies estrictamente necesarias, es posible que no pueda acceder a algunas partes de la Plataforma.
      </p>
      <p>Instrucciones para los navegadores más comunes:</p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
        <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
      </ul>

      <p>
        También puede retirar su consentimiento en cualquier momento haciendo clic en el enlace "Gestionar cookies" en el pie de página.
      </p>

      <h2>Actualizaciones</h2>
      <p>
        Podemos actualizar esta Política de Cookies para reflejar cambios en las cookies que utilizamos. Le notificaremos cualquier cambio relevante mediante un aviso en la Plataforma.
      </p>
    </article>
  );
}
