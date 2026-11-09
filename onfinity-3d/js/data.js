// Content for the prototype.
// Product copy, models, features, offices and clients are taken from
// onfinitytechnologies.com. Prices are PLACEHOLDERS for the prototype and
// must be replaced with real pricing from Onfinity before launch.

const IMG = 'assets/img/';

export const SERIES = [
  {
    id: 'smart',
    screen: 'hummingbird',
    tab: 'Smart 4K',
    name: 'Onfinity Smart 4K LED TV',
    desc: 'Brilliant detail, vibrant colour and smart connectivity. Powered by Android with YouTube, Netflix and Prime Video pre-loaded.',
    image: IMG + '4k.jpg',
    sizes: [32, 43, 55, 65, 75],
    models: { 32: 'ST-32H', 43: 'ST-43K', 55: 'ST-55K', 65: 'ST-65K', 75: 'ST-75K' },
    prices: { 32: 12990, 43: 22990, 55: 34990, 65: 49990, 75: 79990 },
    specs: (s) => [
      ['Resolution', s === 32 ? 'HD Ready' : '4K UHD 3840×2160'],
      ['Refresh rate', '60 Hz'],
      ['Audio', '20 W speakers'],
      ['Platform', 'Android OS'],
      ['Viewing angle', '178°'],
      ['Inputs', 'HDMI · USB · VGA · AV · LAN'],
    ],
  },
  {
    id: 'qled',
    screen: 'flower',
    tab: 'QLED',
    name: 'Onfinity QLED Smart TV',
    desc: 'Brighter screens and vibrant quantum-dot colour, ideal for well-lit rooms where bold, clear visuals matter.',
    image: IMG + 'render-qled.jpg',
    sizes: [43, 55, 65, 75],
    models: { 43: 'ON-43GQDP' },
    prices: { 43: 27990, 55: 42990, 65: 61990, 75: 94990 },
    specs: () => [
      ['Panel', 'QLED, 4K UHD'],
      ['Brightness', 'High-brightness'],
      ['Audio', '20 W speakers'],
      ['Platform', 'Smart OS, voice remote'],
      ['Design', 'Slim, bezel-less'],
      ['Screen', 'Non-glare'],
    ],
  },
  {
    id: 'oled',
    screen: 'flower',
    tab: 'OLED',
    name: 'Onfinity OLED TV',
    desc: 'Deep blacks and high contrast from self-lit pixels. Best suited to premium viewing with sharp, detailed picture quality.',
    image: IMG + 'render-oled.jpg',
    sizes: [55, 65],
    models: {},
    prices: { 55: 119990, 65: 169990 },
    specs: () => [
      ['Panel', 'OLED, 4K UHD'],
      ['Contrast', 'True black, per-pixel'],
      ['Audio', '20 W speakers'],
      ['Platform', 'Smart OS, voice remote'],
      ['Viewing angle', '178°'],
      ['Design', 'Ultra-slim'],
    ],
  },
  {
    id: 'pro',
    screen: 'hummingbird',
    tab: 'Large format',
    name: 'Onfinity 4K Large Format',
    desc: 'Big-screen 4K for home theatres, boardrooms and lobbies, in sizes up to 98 inches.',
    image: IMG + 'office.jpg',
    sizes: [65, 75, 86, 98],
    models: { 65: 'CD-65K', 75: 'CD-75K', 86: 'CD-86K' },
    prices: { 65: 89990, 75: 129990, 86: 199990, 98: 349990 },
    specs: () => [
      ['Resolution', '4K UHD 3840×2160'],
      ['Refresh rate', '60 Hz'],
      ['Operation', 'Extended-hours ready'],
      ['Screen', 'Non-glare'],
      ['Inputs', 'HDMI · USB · VGA · LAN · Audio'],
      ['Mounting', 'Wall / floor stand'],
    ],
  },
];

// Screens in the "Infinite Showroom" corridor.
export const SHOWROOM = [
  {
    ar: 'tv-55', title: 'Smart 4K Televisions', cat: 'Home entertainment', img: IMG + '4k.jpg', aspect: 1.5,
    desc: 'Onfinity Smart 4K TVs bring images to life with brilliant detail, vibrant colour and smart connectivity. Powered by Android OS.',
    list: ['Slim, bezel-less design', 'True 4K, 60 Hz panel', '20 W speaker output', 'Available from 32" to 98"'],
  },
  {
    ar: 'tv-65', title: 'QLED Televisions', cat: 'Home entertainment', img: IMG + 'render-qled.jpg', aspect: 1.333,
    desc: 'QLED TVs offer brighter screens and vibrant colours. Ideal for well-lit spaces where clear and bold visuals are important.',
    list: ['Quantum-dot colour', 'Non-glare screen', 'Voice control & screen sharing'],
  },
  {
    ar: 'ifpd-75', title: 'Interactive Flat Panels', cat: 'Education & enterprise', img: IMG + 'education.jpg', aspect: 1.816,
    desc: 'Multi-touch 4K displays with built-in AI tools and collaboration features, for smart classrooms, training and board rooms.',
    list: ['10-point multi-touch', 'Integrated Android, optional i3/i5 PC', 'Dust-proof design', 'Ignite, Maxim & Bloom series'],
  },
  {
    ar: 'led', pid: 'led', title: 'LED Video Walls', cat: 'Indoor & outdoor', img: IMG + 'outdoor-led.jpg', aspect: 1.5,
    desc: 'Pixel-perfect indoor and outdoor LED walls engineered for 24/7 operation, in custom sizes and configurations.',
    list: ['Active & COB LED options', 'Command centres, retail, arenas, façades', '135" all-in-one video wall'],
  },
  {
    ar: 'kiosk', pid: 'kiosk', title: 'Digital Signage Kiosks', cat: 'Retail & public spaces', img: IMG + 'kiosk-crop.jpg', aspect: 0.88,
    desc: 'Say it loud and clear. Floor-standing touch kiosks for wayfinding, promotions and self-service.',
    list: ['Portrait touch display', 'Remote content management', 'Malls, hospitals, banks, campuses'],
  },
  {
    ar: 'camera', pid: 'camera', title: 'Video Conferencing', cat: 'Collaboration', img: IMG + 'enterprise.jpg', aspect: 1.786,
    desc: 'From conferencing cameras to meeting-room displays — teamwork made simple across locations.',
    list: ['PTZ conferencing cameras', 'Meeting-room displays', 'Wireless screen sharing'],
  },
  {
    ar: 'led', title: 'Command & Control', cat: 'Defence & government', img: IMG + 'defence.jpg', aspect: 1.75,
    desc: 'Clear visuals and uninterrupted communication for command centres, briefing rooms and training setups.',
    list: ['Display walls', 'Real-time situational updates', 'Built for reliability'],
  },
  {
    ar: 'display-info', title: 'Healthcare Displays', cat: 'Hospitals', img: IMG + 'healthcare.jpg', aspect: 1.495,
    desc: 'Manage queues, show doctor availability and guide patients with easy-to-read displays.',
    list: ['Queue management', 'Department-wide updates', 'Patient wayfinding'],
  },
  {
    ar: 'display-55', pid: 'display', title: 'Commercial Displays', cat: 'Boardrooms', img: IMG + 'office.jpg', aspect: 1.333,
    desc: 'Large-format 4K displays for boardrooms, lobbies and dashboards.',
    list: ['65" to 98" sizes', 'Extended-hours operation', 'Wall or stand mount'],
  },
  {
    title: 'The Complete Ecosystem', cat: 'Experience centre', img: IMG + 'all-in-one-crop.jpg', aspect: 1.5,
    desc: 'Panels, TVs, cameras, podiums, kiosks and audio — designed to work together. See them all at our experience centre.',
    list: ['Panchkula & Noida', 'Live demos', 'Book a visit or a home demo'],
  },
];

export const SOLUTIONS = [
  { title: 'Education', img: IMG + 'education.jpg', text: 'Interactive flat panels and classroom systems that improve teacher-student interaction, make learning visual and deliver content effectively.' },
  { title: 'Enterprise', img: IMG + 'enterprise.jpg', text: 'Conferencing cameras, meeting-room displays and signage that make teamwork easier across locations.' },
  { title: 'Healthcare', img: IMG + 'healthcare.jpg', text: 'Queue management, doctor availability and patient guidance on easy-to-read displays.' },
  { title: 'Government & Smart City', img: IMG + 'video-wall-crop.jpg', text: 'Command & control centres, display walls, public information systems, Smart Anganwadi, E-Courts and E-Panchayat.' },
  { title: 'Retail', img: IMG + 'outdoor-led.jpg', text: 'Highlight offers, showcase products and keep every screen updated without manual effort.' },
  { title: 'BFSI', img: IMG + 'smarter-screens.jpg', text: 'Queue management, service information and real-time updates for busy branch counters.' },
  { title: 'Defence', img: IMG + 'defence.jpg', text: 'Clear visuals and coordination for command centres, briefing rooms and training setups.' },
];

export const CLIENTS = Array.from({ length: 25 }, (_, i) => `assets/clients/brand${i + 1}.jpg`);

export const LOADER_LINES = [
  'WARMING UP THE PANEL',
  'CALIBRATING 8.3 MILLION PIXELS',
  'ALIGNING THE BACKLIGHT',
  'DUSTPROOFING FOR INDIA',
  'SURVIVING THE POWER CUT',
  'TUNING THE 178° VIEW',
  'PAIRING THE VOICE REMOTE',
  'PRELOADING YOUR APPS',
  'FINDING THE REMOTE IN THE SOFA',
  'POLISHING THE BEZEL (THERE ISN\'T ONE)',
];

export const inr = (n) => '₹ ' + n.toLocaleString('en-IN');
