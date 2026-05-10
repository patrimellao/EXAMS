export const metadata = {
  title: "Términos de Servicio | TuFolio",
};

export default function Terminos() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Términos de Servicio</h1>
      <p className="text-muted-foreground text-sm">Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</p>

      <h2>1. Aceptación de los términos</h2>
      <p>
        Al registrarse en TuFolio y acceder a la Plataforma, usted acepta quedar vinculado por los presentes Términos de Servicio. Si no está de acuerdo con alguno de estos términos, no debe utilizar la Plataforma.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        TuFolio es una plataforma educativa de modalidad <em>serious game</em> destinada a la preparación de oposiciones y exámenes oficiales relacionados con las instituciones de la Unión Europea. La Plataforma ofrece contenidos en formato texto, cuestionarios interactivos y elementos de gamificación (puntos XP, logros, clasificaciones).
      </p>

      <h2>3. Registro y cuenta de usuario</h2>
      <p>
        Para acceder a las funcionalidades de la Plataforma es necesario crear una cuenta de usuario. El usuario se compromete a proporcionar información veraz y actualizada, y a mantener la confidencialidad de sus credenciales de acceso. El usuario es responsable de todas las actividades que ocurran bajo su cuenta.
      </p>
      <p>
        El titular se reserva el derecho a suspender o cancelar cuentas que incumplan los presentes Términos.
      </p>

      <h2>4. Planes de suscripción y pago</h2>
      <p>
        La Plataforma ofrece un <strong>plan gratuito</strong> con acceso limitado a contenidos, y planes de pago (<strong>Pro Mensual</strong> y <strong>Pro Anual</strong>) con acceso completo. Los precios se muestran en la página de planes antes de realizar el pago.
      </p>
      <p>
        Los pagos se procesan a través de <strong>Lemon Squeezy</strong>. Al suscribirse a un plan de pago, autoriza cargos recurrentes al inicio de cada periodo de facturación.
      </p>

      <h2>5. Derecho de desistimiento (14 días)</h2>
      <p>
        De conformidad con el artículo 103.a de la Ley General para la Defensa de los Consumidores y Usuarios (LGDCU) y la Directiva 2011/83/UE, el consumidor que contrate un plan de pago a través de la Plataforma dispone de un plazo de <strong>14 días naturales</strong> para desistir del contrato sin necesidad de justificación, contados desde la fecha de la suscripción.
      </p>
      <p>
        Para ejercer el derecho de desistimiento, debe notificarlo a <strong>soporte@tufolio.es</strong> antes de que expire dicho plazo. Si ha comenzado a utilizar el servicio de contenido digital durante el plazo de desistimiento, nos indica expresamente que acepta que, una vez comenzada la prestación, perderá el derecho de desistimiento.
      </p>

      <h2>6. Cancelación de la suscripción</h2>
      <p>
        Puede cancelar su suscripción en cualquier momento desde la configuración de su cuenta. La cancelación será efectiva al finalizar el periodo de facturación en curso. No se realizarán reembolsos por periodos ya facturados salvo cuando proceda legalmente.
      </p>

      <h2>7. Conducta del usuario</h2>
      <p>El usuario se compromete a no:</p>
      <ul>
        <li>Compartir, revender, redistribuir o difundir públicamente los contenidos de la Plataforma.</li>
        <li>Intentar eludir cualquier medida de seguridad de la Plataforma.</li>
        <li>Utilizar la Plataforma para fines fraudulentos, ilegales o que vulneren derechos de terceros.</li>
        <li>Crear cuentas múltiples para eludir restricciones del plan gratuito.</li>
      </ul>

      <h2>8. Propiedad intelectual del contenido</h2>
      <p>
        Todos los contenidos educativos (textos, imágenes, cuestionarios) son propiedad del titular o de los docentes que los crean en la Plataforma, y están protegidos por la legislación de propiedad intelectual. Queda prohibida su reproducción o distribución sin autorización.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        TuFolio es un recurso educativo complementario. No garantizamos que la preparación realizada en la Plataforma resulte en la superación de ningún examen u oposición. El titular no será responsable de daños indirectos, incidentales o consecuentes derivados del uso de la Plataforma.
      </p>

      <h2>10. Modificaciones del servicio y de los términos</h2>
      <p>
        Nos reservamos el derecho de modificar estos Términos en cualquier momento. Cuando lo hagamos, le notificaremos con al menos 30 días de antelación por correo electrónico si los cambios son sustanciales. El uso continuado de la Plataforma tras la entrada en vigor de los nuevos Términos implica su aceptación.
      </p>

      <h2>11. Legislación aplicable y jurisdicción</h2>
      <p>
        Las presentes condiciones se rigen por la legislación española. Para la resolución de conflictos, las partes se someten a los Juzgados y Tribunales de Madrid, salvo que la ley aplicable imponga fueros distintos en beneficio del consumidor.
      </p>

      <h2>12. Contacto</h2>
      <p>Para cualquier consulta relacionada con estos Términos, puede contactarnos en <strong>legal@tufolio.es</strong>.</p>
    </article>
  );
}
