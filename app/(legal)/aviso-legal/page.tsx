export const metadata = {
  title: "Aviso Legal | Jean Monnet",
};

export default function AvisoLegal() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Aviso Legal</h1>
      <p className="text-muted-foreground text-sm">Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</p>

      <h2>1. Datos identificativos del titular</h2>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se pone a disposición del usuario la siguiente información:
      </p>
      <ul>
        <li><strong>Denominación social:</strong> [NOMBRE DE LA EMPRESA, S.L.]</li>
        <li><strong>NIF/CIF:</strong> [X00000000X]</li>
        <li><strong>Domicilio social:</strong> [Calle Ejemplo, 1, 28001 Madrid, España]</li>
        <li><strong>Correo electrónico:</strong> legal@jeanmonnet.es</li>
        <li><strong>Teléfono:</strong> [+34 900 000 000]</li>
        <li><strong>Registro Mercantil:</strong> [Inscrita en el Registro Mercantil de Madrid, Tomo X, Folio X, Hoja M-XXXXX]</li>
      </ul>

      <h2>2. Objeto y ámbito de aplicación</h2>
      <p>
        El presente Aviso Legal regula el acceso y uso del sitio web <strong>jeanmonnet.es</strong> (en adelante, "el Sitio Web") y de la plataforma de aprendizaje digital Jean Monnet (en adelante, "la Plataforma"), titularidad del responsable indicado anteriormente.
      </p>
      <p>
        El acceso al Sitio Web y a la Plataforma atribuye la condición de usuario e implica la aceptación plena y sin reservas de todas las disposiciones incluidas en este Aviso Legal, así como en la Política de Privacidad y en la Política de Cookies.
      </p>

      <h2>3. Propiedad intelectual e industrial</h2>
      <p>
        Todos los contenidos del Sitio Web y de la Plataforma —incluyendo, a título enunciativo pero no limitativo, textos, imágenes, gráficos, logotipos, iconos, software y código fuente— son propiedad del titular o de terceros que le han cedido los correspondientes derechos de explotación, y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial.
      </p>
      <p>
        Queda expresamente prohibida la reproducción, distribución, comunicación pública, transformación o cualquier otro acto de explotación de dichos contenidos sin la previa autorización escrita del titular.
      </p>

      <h2>4. Condiciones de uso</h2>
      <p>
        El usuario se compromete a utilizar el Sitio Web y la Plataforma de conformidad con la ley, el presente Aviso Legal, la moral y el orden público. Asimismo, se obliga a no utilizar la Plataforma con fines ilícitos o lesivos para derechos e intereses de terceros.
      </p>
      <p>
        El titular se reserva el derecho de retirar o suspender el acceso a la Plataforma, de forma temporal o definitiva, a aquellos usuarios que incumplan estas condiciones.
      </p>

      <h2>5. Exclusión de responsabilidad</h2>
      <p>
        El titular no garantiza la disponibilidad y continuidad ininterrumpida del funcionamiento del Sitio Web y la Plataforma. En la medida en que sea posible conforme a la ley aplicable, el titular excluye cualquier responsabilidad por los daños y perjuicios de cualquier naturaleza que puedan derivarse de la falta de disponibilidad o continuidad del funcionamiento de la Plataforma.
      </p>

      <h2>6. Legislación y jurisdicción aplicables</h2>
      <p>
        Las presentes condiciones se rigen e interpretan conforme a la legislación española. Para la resolución de cualquier controversia derivada del acceso o uso del Sitio Web y la Plataforma, las partes se someten a los Juzgados y Tribunales de Madrid, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.
      </p>
    </article>
  );
}
