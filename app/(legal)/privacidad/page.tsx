export const metadata = {
  title: "Política de Privacidad | TuFolio",
};

export default function Privacidad() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Política de Privacidad</h1>
      <p className="text-muted-foreground text-sm">Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</p>

      <p>
        En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD) y de la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), le informamos sobre el tratamiento de sus datos personales.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li><strong>Identidad:</strong> [NOMBRE DE LA EMPRESA, S.L.]</li>
        <li><strong>NIF:</strong> [X00000000X]</li>
        <li><strong>Dirección:</strong> [Calle Ejemplo, 1, 28001 Madrid, España]</li>
        <li><strong>Contacto DPD / privacidad:</strong> privacidad@tufolio.es</li>
      </ul>

      <h2>2. Datos que recopilamos</h2>
      <p>Recopilamos las siguientes categorías de datos personales:</p>
      <ul>
        <li><strong>Datos de registro:</strong> nombre completo, dirección de correo electrónico y contraseña (almacenada de forma cifrada).</li>
        <li><strong>Datos de uso:</strong> progreso en ejercicios y cuestionarios, racha de actividad, puntuación XP y posición en la clasificación.</li>
        <li><strong>Datos de facturación:</strong> identificadores de cliente y suscripción gestionados por Lemon Squeezy (no almacenamos los datos de tarjeta de crédito).</li>
        <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador y sistema operativo, recogidos automáticamente en los registros del servidor.</li>
        <li><strong>Cookies:</strong> tal y como se describe en nuestra Política de Cookies.</li>
      </ul>

      <h2>3. Finalidad y base jurídica del tratamiento</h2>
      <table>
        <thead>
          <tr>
            <th>Finalidad</th>
            <th>Base jurídica</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Crear y gestionar su cuenta de usuario</td>
            <td>Ejecución de un contrato (art. 6.1.b RGPD)</td>
          </tr>
          <tr>
            <td>Prestar el servicio educativo de la Plataforma</td>
            <td>Ejecución de un contrato (art. 6.1.b RGPD)</td>
          </tr>
          <tr>
            <td>Procesar pagos y gestionar suscripciones</td>
            <td>Ejecución de un contrato (art. 6.1.b RGPD)</td>
          </tr>
          <tr>
            <td>Enviar comunicaciones de servicio (cambios, incidencias)</td>
            <td>Interés legítimo (art. 6.1.f RGPD)</td>
          </tr>
          <tr>
            <td>Analizar el uso de la Plataforma y mejorar el servicio</td>
            <td>Interés legítimo (art. 6.1.f RGPD)</td>
          </tr>
          <tr>
            <td>Cumplir obligaciones legales (contabilidad, fiscal)</td>
            <td>Cumplimiento de obligación legal (art. 6.1.c RGPD)</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Destinatarios y transferencias internacionales</h2>
      <p>Sus datos podrán ser comunicados a los siguientes destinatarios:</p>
      <ul>
        <li><strong>Lemon Squeezy (US)</strong> — procesador de pagos. Transferencia amparada en cláusulas contractuales tipo de la Comisión Europea.</li>
        <li><strong>Cloudflare, Inc. (US)</strong> — almacenamiento de ficheros (R2). Transferencia amparada en el Marco de Privacidad de Datos UE-EE.UU. (DPF).</li>
        <li><strong>Autoridades competentes</strong> — cuando exista obligación legal.</li>
      </ul>
      <p>No realizamos cesiones de datos a terceros para fines publicitarios.</p>

      <h2>5. Plazo de conservación</h2>
      <ul>
        <li><strong>Datos de cuenta:</strong> durante la vigencia de la relación contractual y, una vez finalizada, durante los plazos previstos legalmente (máximo 6 años para obligaciones fiscales y mercantiles).</li>
        <li><strong>Registros de actividad (logs):</strong> 12 meses.</li>
        <li><strong>Datos de facturación:</strong> 6 años.</li>
      </ul>

      <h2>6. Sus derechos</h2>
      <p>Puede ejercer en cualquier momento los siguientes derechos:</p>
      <ul>
        <li><strong>Acceso</strong> a sus datos personales.</li>
        <li><strong>Rectificación</strong> de datos inexactos o incompletos.</li>
        <li><strong>Supresión</strong> ("derecho al olvido") cuando proceda.</li>
        <li><strong>Limitación</strong> del tratamiento.</li>
        <li><strong>Portabilidad</strong> de sus datos en formato estructurado.</li>
        <li><strong>Oposición</strong> al tratamiento basado en interés legítimo.</li>
      </ul>
      <p>
        Para ejercer sus derechos, envíe un correo a <strong>privacidad@tufolio.es</strong> indicando su nombre, correo electrónico de registro y el derecho que desea ejercer. Responderemos en el plazo de un mes.
      </p>
      <p>
        Si considera que el tratamiento no es conforme al RGPD, puede presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) en <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas apropiadas para proteger sus datos contra el acceso no autorizado, la pérdida accidental o la destrucción. Las contraseñas se almacenan utilizando algoritmos de hash irreversibles con sal.
      </p>

      <h2>8. Cambios en esta política</h2>
      <p>
        Nos reservamos el derecho de actualizar esta Política de Privacidad. Cuando lo hagamos, revisaremos la fecha de "última actualización" que aparece en la parte superior. Le notificaremos cualquier cambio significativo por correo electrónico.
      </p>
    </article>
  );
}
