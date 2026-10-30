import type { ProductShowcaseItem } from "@/domain/entities/product-showcase";

// Las fotos se generan con scripts/generate-product-images.mts (mismo slug).
const image = (slug: string) => `/images/productos/${slug}.webp`;

export const productShowcaseData: readonly ProductShowcaseItem[] = [
  // Papeles
  {
    slug: "papel-fotocopia",
    lineSourceName: "PAPEL FOTOCOPIA",
    name: "Papel fotocopia",
    familyId: "papeles",
    image: image("papel-fotocopia"),
    highlight: "Listo para oficina",
    summary:
      "Resmas en formatos cortados A4 y A3, con blancura pareja y buen paso por fotocopiadoras e impresoras láser o de tinta.",
    uses: ["Oficinas y colegios", "Impresión láser e inkjet", "Documentos y formularios"],
  },
  {
    slug: "bobinas-de-papel",
    lineSourceName: "BOBINAS DE PAPEL",
    name: "Bobinas de papel",
    familyId: "papeles",
    image: image("bobinas-de-papel"),
    highlight: "Rollos para punto de venta",
    summary:
      "Rollos en distintos anchos para cajas registradoras, datáfonos y calculadoras. Corte limpio y bobinado firme.",
    uses: ["Cajas registradoras", "Datáfonos", "Tickets y comprobantes"],
  },
  {
    slug: "papel-bond",
    lineSourceName: "PAPEL BOND",
    name: "Papel bond",
    familyId: "papeles",
    image: image("papel-bond"),
    highlight: "El básico de imprenta",
    summary:
      "Papel sin recubrimiento, de superficie uniforme y buena opacidad. Recibe bien la tinta offset y es fácil de escribir.",
    uses: ["Impresión offset", "Cuadernos y libretas", "Formularios y papelería"],
  },
  {
    slug: "papel-bond-colores-pasteles",
    lineSourceName: "PAPEL BOND COLORES PASTELES",
    name: "Papel bond colores pasteles",
    familyId: "papeles",
    image: image("papel-bond-colores-pasteles"),
    highlight: "Rosado, amarillo, celeste y verde",
    summary:
      "La misma calidad del bond en tonos suaves. Ideal para diferenciar copias, áreas o documentos de un vistazo.",
    uses: ["Copias de facturas", "Volantes", "Material escolar"],
  },
  {
    slug: "papel-couche-brillante-c2s",
    lineSourceName: "PAPEL COUCHE C2S BRILLANTE (GLOSS)",
    name: "Papel couché brillante C2S",
    familyId: "papeles",
    image: image("papel-couche-brillante-c2s"),
    highlight: "Brillo en ambas caras",
    summary:
      "Estucado por los dos lados con acabado gloss. Colores intensos, negros profundos y gran definición en fotografías.",
    uses: ["Catálogos y revistas", "Afiches y volantes", "Portadas"],
  },
  {
    slug: "papel-couche-mate",
    lineSourceName: "PAPEL COUCHE MATE",
    name: "Papel couché mate",
    familyId: "papeles",
    image: image("papel-couche-mate"),
    highlight: "Acabado elegante, sin reflejos",
    summary:
      "Superficie estucada de tacto suave que no refleja la luz. Excelente legibilidad y una impresión sobria y premium.",
    uses: ["Libros y memorias", "Brochures corporativos", "Menús"],
  },
  {
    slug: "papel-etiqueta-c1s",
    lineSourceName: "PAPEL ETIQUETA C1S (GLOSS 1 CARA)",
    name: "Papel etiqueta C1S",
    familyId: "papeles",
    image: image("papel-etiqueta-c1s"),
    highlight: "Brillo en una cara",
    summary:
      "Estucado brillante por el frente y natural al reverso, pensado para recibir adhesivos y pegamentos de etiquetado.",
    uses: ["Etiquetas de botellas", "Envolturas", "Rotulado de productos"],
  },
  {
    slug: "papel-kraft",
    lineSourceName: "PAPEL KRAFT",
    name: "Papel kraft",
    familyId: "papeles",
    image: image("papel-kraft"),
    highlight: "Resistente y natural",
    summary:
      "Fibra larga de color café, muy resistente al rasgado. Su aspecto natural funciona tanto en empaque como en diseño.",
    uses: ["Bolsas y fundas", "Envolturas", "Manualidades y diseño"],
  },
  {
    slug: "papel-periodico",
    lineSourceName: "PAPEL PERIÓDICO",
    name: "Papel periódico",
    familyId: "papeles",
    image: image("papel-periodico"),
    highlight: "Económico y liviano",
    summary:
      "Papel de bajo gramaje y alto rendimiento por kilo. Rinde en tirajes grandes y sirve también como relleno de embalaje.",
    uses: ["Periódicos y revistas", "Libros económicos", "Protección y embalaje"],
  },
  {
    slug: "papel-de-empaque",
    lineSourceName: "PAPEL DE EMPAQUE",
    name: "Papel de empaque",
    familyId: "papeles",
    image: image("papel-de-empaque"),
    highlight: "Para envolver y proteger",
    summary:
      "Papel flexible y resistente para envolver mercadería, proteger superficies y armar presentaciones en tienda.",
    uses: ["Comercios y bodegas", "Envoltura de regalos", "Protección en traslados"],
  },
  {
    slug: "papelografos",
    lineSourceName: "PRODUCCIÓN",
    name: "Papelógrafos",
    familyId: "papeles",
    image: image("papelografos"),
    highlight: "Pliegos grandes listos para usar",
    summary:
      "Hojas de gran formato para exposiciones, talleres y capacitaciones. Superficie lisa para marcadores y crayones.",
    uses: ["Colegios y universidades", "Talleres y capacitaciones", "Presentaciones"],
  },

  // Cartulinas
  {
    slug: "cartulina-triplex-respaldo-blanco",
    lineSourceName: "CARTULINA TRIPLEX RESPALDO BLANCO",
    name: "Cartulina tríplex respaldo blanco",
    familyId: "cartulinas",
    image: image("cartulina-triplex-respaldo-blanco"),
    highlight: "Blanca por ambos lados",
    summary:
      "Cartulina de tres capas, rígida y con frente estucado de alta blancura. Para empaques que se ven bien por dentro y por fuera.",
    uses: ["Cajas de cosméticos", "Empaques farmacéuticos", "Exhibidores"],
  },
  {
    slug: "cartulina-duplex-respaldo-blanco",
    lineSourceName: "CARTULINA DÚPLEX RESPALDO BLANCO",
    name: "Cartulina dúplex respaldo blanco",
    familyId: "cartulinas",
    image: image("cartulina-duplex-respaldo-blanco"),
    highlight: "Frente estucado, reverso claro",
    summary:
      "Buena rigidez y excelente superficie de impresión. La opción versátil para cajas plegadizas y estuches.",
    uses: ["Cajas plegadizas", "Estuches", "Carpetas"],
  },
  {
    slug: "cartulina-duplex-respaldo-cafe",
    lineSourceName: "CARTULINA DÚPLEX RESPALDO CAFÉ",
    name: "Cartulina dúplex respaldo café",
    familyId: "cartulinas",
    image: image("cartulina-duplex-respaldo-cafe"),
    highlight: "Frente blanco, reverso kraft",
    summary:
      "Frente blanco imprimible y reverso café de fibra reciclada. Económica y firme para empaques de consumo masivo.",
    uses: ["Cajas de alimentos secos", "Empaques de calzado", "Cajas de despacho"],
  },
  {
    slug: "cartulina-duplex-2-caras-cafe",
    lineSourceName: "CARTULINA DÚPLEX 2 CARAS CAFÉ",
    name: "Cartulina dúplex 2 caras café",
    familyId: "cartulinas",
    image: image("cartulina-duplex-2-caras-cafe"),
    highlight: "Café por ambos lados",
    summary:
      "Cartulina de aspecto natural en las dos caras. Perfecta para marcas que buscan una estética kraft y sostenible.",
    uses: ["Empaques ecológicos", "Etiquetas colgantes", "Separadores"],
  },
  {
    slug: "cartulina-ecologica-natural",
    lineSourceName: "CARTULINA ECOLÓGICA NATURAL",
    name: "Cartulina ecológica natural",
    familyId: "cartulinas",
    image: image("cartulina-ecologica-natural"),
    highlight: "Fibras naturales",
    summary:
      "Elaborada con fibras de menor impacto ambiental, con un tono crema cálido y textura natural visible.",
    uses: ["Empaques sostenibles", "Tarjetas e invitaciones", "Papelería de marca"],
  },
  {
    slug: "cartulinas-satinadas",
    lineSourceName: "CARTULINAS SATINADAS",
    name: "Cartulinas satinadas",
    familyId: "cartulinas",
    image: image("cartulinas-satinadas"),
    highlight: "Alto calibre con brillo suave",
    summary:
      "Superficie satinada y cuerpo firme para piezas que se tocan y se guardan: tarjetas, invitaciones y diplomas.",
    uses: ["Tarjetas de presentación", "Invitaciones", "Diplomas y certificados"],
  },
  {
    slug: "cartulina-bristol",
    lineSourceName: "CARTULINA BRISTOL",
    name: "Cartulina bristol",
    familyId: "cartulinas",
    image: image("cartulina-bristol"),
    highlight: "Variedad de colores",
    summary:
      "Cartulina lisa en blanco y colores vivos. Fácil de cortar, doblar y pegar, la favorita para trabajos escolares.",
    uses: ["Material escolar", "Manualidades", "Señalética sencilla"],
  },

  // Cartones
  {
    slug: "carton-gris-prensado",
    lineSourceName: "CARTÓN GRIS PRENSADO",
    name: "Cartón gris prensado",
    familyId: "cartones",
    image: image("carton-gris-prensado"),
    highlight: "Rígido y estable",
    summary:
      "Cartón compacto de alta densidad que no se deforma. La base de tapas duras, cajas rígidas y carpetas.",
    uses: ["Encuadernación de libros", "Cajas rígidas", "Carpetas y archivadores"],
  },
  {
    slug: "carton-paja",
    lineSourceName: "CARTÓN PAJA",
    name: "Cartón paja",
    familyId: "cartones",
    image: image("carton-paja"),
    highlight: "Económico y firme",
    summary:
      "Cartón de fibra prensada en tono amarillento. Una alternativa económica para refuerzos y trabajos de armado.",
    uses: ["Refuerzos de empaque", "Respaldo de blocks", "Maquetas"],
  },

  // Materiales especializados
  {
    slug: "cartulina-respaldo-blanco-con-polietileno",
    lineSourceName: "CARTULINA RESPALDO BLANCO CON POLIETILENO (PE 0-GR-15-PLÁSTIFICADA)",
    name: "Cartulina respaldo blanco con polietileno",
    familyId: "materiales-especializados",
    image: image("cartulina-respaldo-blanco-con-polietileno"),
    highlight: "Resiste líquidos y humedad",
    summary:
      "Cartulina blanca con capa de polietileno que la protege de la humedad. Para envases que contienen líquidos o alimentos húmedos.",
    uses: ["Vasos de papel", "Platos y bandejas", "Envases para comida"],
  },
  {
    slug: "cartulina-respaldo-cafe-con-polietileno",
    lineSourceName: "CARTULINA RESPALDO CAFÉ CON POLIETILENO (PE 0-GR-15-PLASTIFICADA)",
    name: "Cartulina respaldo café con polietileno",
    familyId: "materiales-especializados",
    image: image("cartulina-respaldo-cafe-con-polietileno"),
    highlight: "Plastificada, reverso kraft",
    summary:
      "La protección del polietileno con un reverso café de aspecto natural. Ideal para envases de comida con imagen artesanal.",
    uses: ["Vasos kraft", "Contenedores de comida", "Empaques para llevar"],
  },
  {
    slug: "cartulina-antigrasa-kit-7",
    lineSourceName: "CARTULINA EARTH PACT NATURAL OFFSET ANTIGRASA KIT 7",
    name: "Cartulina antigrasa Kit 7",
    familyId: "materiales-especializados",
    image: image("cartulina-antigrasa-kit-7"),
    highlight: "Resistencia a grasas Kit 7",
    summary:
      "Cartulina natural tratada para resistir grasas y aceites sin mancharse. Imprimible en offset.",
    uses: ["Comida rápida", "Panadería y pastelería", "Cajas para llevar"],
  },
  {
    slug: "papel-alimenticio",
    lineSourceName: "PAPEL ALIMENTICIO",
    name: "Papel alimenticio",
    familyId: "materiales-especializados",
    image: image("papel-alimenticio"),
    highlight: "Contacto directo con alimentos",
    summary:
      "Papel de grado alimenticio, limpio e higiénico, apto para envolver y presentar alimentos de forma segura.",
    uses: ["Panaderías", "Delicatessen y carnicerías", "Bandejas y forros"],
  },
  {
    slug: "papel-adhesivo",
    lineSourceName: "PAPEL ADHESIVO",
    name: "Papel adhesivo",
    familyId: "materiales-especializados",
    image: image("papel-adhesivo"),
    highlight: "Etiquetas y stickers",
    summary:
      "Papel autoadhesivo con liner siliconado, fácil de imprimir, troquelar y despegar. También en versiones de seguridad.",
    uses: ["Etiquetas de producto", "Stickers", "Sellos de garantía"],
  },
  {
    slug: "papel-quimico-autocopiativo",
    lineSourceName: "PAPEL QUIMICO",
    name: "Papel químico (autocopiativo)",
    familyId: "materiales-especializados",
    image: image("papel-quimico-autocopiativo"),
    highlight: "Copias sin carbón",
    summary:
      "Juegos CB, CFB y CF que transfieren la escritura a las copias sin papel carbón. En blanco y colores.",
    uses: ["Facturas", "Notas de venta", "Formularios con copias"],
  },
];
