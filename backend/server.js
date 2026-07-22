const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('./db');

const ROOT_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT || 3306),
};
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const FORCE_SYNC_FROM_WEB = process.env.FORCE_SYNC_FROM_WEB === '1';
const JWT_SECRET = process.env.JWT_SECRET || 'fukampus-dev-jwt-degistirin';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/** OBS benzeri modül izinleri — rol bazlı atanır. */
const ROLE_PERMISSIONS = {
  ogrenci: ['akademik_kayit', 'not_belgesi', 'odeme_harc'],
  ogretim_gorevlisi: ['yoklama', 'not_girisi', 'not_belgesi'],
  personel: ['personel_ozluk'],
  sistem_yoneticisi: [
    'akademik_kayit',
    'not_belgesi',
    'odeme_harc',
    'yoklama',
    'not_girisi',
    'personel_ozluk',
    'icerik_yonetimi',
  ],
};

function permissionsForRole(role) {
  const list = ROLE_PERMISSIONS[role];
  return Array.isArray(list) ? [...list] : [];
}

function signObsJwt(userRow) {
  const permissions = permissionsForRole(userRow.role);
  return jwt.sign(
    {
      sub: userRow.id,
      username: userRow.username,
      role: userRow.role,
      permissions,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyObsJwt(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function bearerToken(req) {
  const raw = req.headers.authorization || '';
  if (!raw.startsWith('Bearer ')) return '';
  return raw.slice('Bearer '.length).trim();
}

function formatDateTR(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

async function ensureDatabaseExists() {
  const conn = await mysql.createConnection(ROOT_CONFIG);
  await conn.query(
    'CREATE DATABASE IF NOT EXISTS fukampus_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
  );
  await conn.end();
}

async function ensureNewsTableAndSeed() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS news (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      \`date\` DATE NOT NULL,
      image_url VARCHAR(2000) NOT NULL,
      content TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await pool.query('ALTER TABLE news ADD COLUMN content TEXT NULL');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e;
  }

  const [countRows] = await pool.query('SELECT COUNT(*) AS c FROM news');
  const count = countRows[0]?.c ?? 0;
  if (count >= 15) return;
  if (count > 0) {
    await pool.query('DELETE FROM news');
  }

  const samples = [
    [
      'İSG öğrencilerimiz AFAD Elazığ İl Müdürlüğünde uygulamalı arama-kurtarma eğitimi aldı',
      '2026-04-02',
      'https://picsum.photos/seed/funews1/800/450',
      'Fırat Üniversitesi Teknik Bilimler Meslek Yüksekokulu İş Sağlığı ve Güvenliği Programı öğrencileri, bu yıl AFAD Elazığ İl Müdürlüğü ile ortak düzenlenen uygulamalı eğitim programına katıldı.\n\nEğitim kapsamında öğrenciler; enkaz altında arama-kurtarma teknikleri, sedye ile hasta taşıma yöntemleri ve olası deprem senaryolarına yönelik tahliye tatbikatı gerçekleştirdi. AFAD uzmanları, teori bilgisini sahaya yansıtmanın önemine dikkat çekerek öğrencilere meslek yaşamlarında karşılaşabilecekleri acil durum prosedürlerini aktardı.\n\nBölüm Başkanı Dr. Öğr. Üyesi Mehmet Yıldız, "Öğrencilerimizin teorik eğitimlerini saha deneyimiyle pekiştirmeleri, mezuniyet sonrası iş hayatına hazırlıkları açısından son derece değerlidir." dedi.\n\nEğitim, katılımcı öğrencilere sertifika verilerek tamamlandı.',
    ],
    [
      'İş Sağlığı ve Güvenliği öğrencileri Elazığ Belediyesi ile Güvenli Şehir farkındalık etkinliği düzenledi',
      '2026-03-18',
      'https://picsum.photos/seed/funews2/800/450',
      'TB MYO İş Sağlığı ve Güvenliği Programı öğrencileri, Elazığ Belediyesi Sosyal Hizmetler Müdürlüğü ile iş birliği yaparak şehrin farklı mahallelerinde "Güvenli Şehir, Bilinçli Vatandaş" başlıklı farkındalık etkinliği düzenledi.\n\nEtkinlik boyunca öğrenciler; iş kazalarının önlenmesi, ev ve işyeri yangın güvenliği ile trafik güvenliği konularında broşür dağıtarak vatandaşları bilgilendirdi. Aynı zamanda ilk yardım uygulama standları kuruldu; vatandaşlara temel CPR ve yara sarma teknikleri tanıtıldı.\n\nElazığ Belediye Başkan Yardımcısı, etkinliği değerlendirerek "Üniversitemizin gençleri toplumsal sorumluluk bilincini bu kadar erken yaşta hayata geçiriyor, bu bizler için büyük bir gurur kaynağı." ifadesini kullandı.\n\nEtkinliğe yaklaşık 350 vatandaş katılım sağladı.',
    ],
    [
      'Bilgisayar Teknolojileri Bölümü öğrencileri TÜBİTAK 2209-A projesine kabul aldı',
      '2026-03-05',
      'https://picsum.photos/seed/funews3/800/450',
      'Bilgisayar Teknolojileri Bölümü Bilgisayar Programcılığı Programı ikinci sınıf öğrencilerinden oluşan dört kişilik ekip, TÜBİTAK 2209-A Üniversite Öğrencileri Araştırma Projeleri Destekleme Programına başvurdu ve proje teklifleri kabul gördü.\n\n"Görme Engelliler İçin Yapay Zekâ Destekli Nesne Tanıma Uygulaması" başlıklı proje; akıllı telefon kamerası aracılığıyla gerçek zamanlı nesne tanımlama ve sesli geri bildirim sağlamayı hedefliyor. Proje danışmanı Öğr. Gör. Ayşe Kılıç, "Öğrencilerimiz hem teknik becerilerini hem de toplumsal duyarlılıklarını bu projeyle bir araya getirdi." diye konuştu.\n\nProje, 12 ay süreyle TÜBİTAK tarafından desteklenecek. Ekip, çalışmaları tamamlandığında sonuçları ulusal bir sempozyumda sunmayı planlıyor.',
    ],
    [
      'TB MYO Kariyer Günleri: 12 firmadan 200 den fazla öğrenciye staj ve iş imkânı sunuldu',
      '2026-02-20',
      'https://picsum.photos/seed/funews4/800/450',
      'Teknik Bilimler Meslek Yüksekokulu, her yıl geleneksel olarak düzenlediği Kariyer Günleri etkinliğinin bu yılki buluşmasını 18-19 Şubat tarihlerinde gerçekleştirdi.\n\nEtkinliğe otomotiv, elektrik, yazılım, inşaat ve medya sektörlerinden 12 firma katıldı. Firmalar stant kurarak öğrencilerle bire bir görüşme fırsatı buldu; zorunlu ve isteğe bağlı staj başvuruları için ön kayıt formları toplandı. İki gün boyunca 200 den fazla öğrenci firmalar ile tanışarak staj ve mezuniyet sonrası kariyer imkânları hakkında bilgi aldı.\n\nMüdür Yrd. Doç. Dr. Fatma Arslan, "Bu tür etkinlikler öğrencilerimizi gerçek iş dünyasıyla buluşturuyor ve onların özgüvenlerini pekiştiriyor." dedi. Etkinlik, panel konuşmaları ve ağ kurma oturumlarıyla son buldu.',
    ],
    [
      'Elektronik ve Otomasyon Bölümü öğrencileri endüstriyel robot yarışmasında birincilik kazandı',
      '2026-02-10',
      'https://picsum.photos/seed/funews5/800/450',
      'TB MYO Elektronik ve Otomasyon Bölümü Mekatronik Programı öğrencilerinden oluşan "TechBot" takımı, Ankara Ostim Teknik Üniversitesinde düzenlenen Ulusal Endüstriyel Robot Programlama Yarışmasında birincilik elde etti.\n\nYarışmada ekipler; PLC programlama, robotik kol hassasiyeti ve endüstriyel otomasyon görev tamamlama süreleri açısından değerlendirildi. TechBot takımı, tasarladığı esnek üretim hücresiyle jürinin tam puanını aldı.\n\nTakım danışmanı Öğr. Gör. Hasan Demir, "Öğrencilerimiz laboratuvarda edindikleri bilgiyi yarışma ortamında mükemmel şekilde uyguladı. Bu başarı emeğin ödülüdür." yorumunu yaptı.\n\nTakım üyeleri, ödüllerini Rektör Prof. Dr. İlyas Coşkun tarafından takdim edilen plaket töreninde aldı.',
    ],
    [
      'Grafik Tasarım Programı mezunlarından Sosyal Sorumluluk sergisi Elazığ Kültür Merkezinde açıldı',
      '2026-01-28',
      'https://picsum.photos/seed/funews6/800/450',
      'TB MYO Grafik Tasarım Programı 2025 mezunlarının hazırladığı "İz" başlıklı sergi, Elazığ Kültür ve Kongre Merkezinde sanatseverlerle buluştu.\n\nSergide toplumsal sorumluluk, çevre bilinci ve şehir kimliği temalarını işleyen 48 adet orijinal tasarım çalışması sergilendi. Poster, infografik, tipografi ve dijital illüstrasyon gibi farklı disiplinleri kapsayan eserler, mezunların eğitimleri süresince edindikleri mesleki birikimin somut bir yansımasıydı.\n\nAçılış konuşmasında Bölüm Başkanı Öğr. Gör. Zeynep Çelik, "Tasarım yalnızca estetik değil; bir iletişim aracıdır. Öğrencilerimiz bunu bu sergide çok güzel gösterdi." dedi.\n\nSergi, 5 Şubat tarihine kadar ziyaretçilere açık kaldı.',
    ],
    [
      'Makine ve Metal Teknolojileri CNC tezgâh uygulamaları workshopu düzenlendi',
      '2026-01-15',
      'https://picsum.photos/seed/funews7/800/450',
      'Makine ve Metal Teknolojileri Bölümü tarafından düzenlenen "Endüstri 4.0 ve CNC İşleme" workshopuna Makine Programı öğrencileri ve sektör temsilcileri katıldı.\n\nİki günlük etkinlikte katılımcılar; CAD/CAM yazılımları ile 3 eksenli CNC freze programlama, takım seçimi ve kesme parametrelerinin optimizasyonu konularında hem teorik sunum hem de uygulamalı tezgâh deneyimi yaşadı. Etkinliğe konuşmacı olarak katılan Elazığ Organize Sanayi Bölgesi firmasından mühendis Kadir Şahin, sektördeki işgücü ihtiyacını ve mezunlara yönelik istihdam fırsatlarını anlattı.\n\nWorkshop sonunda katılımcılara Sürekli Eğitim Merkezi onaylı sertifika verildi.',
    ],
    [
      'Mimari Restorasyon Programı öğrencileri Harput Kalesi belgeleme çalışması yaptı',
      '2025-12-20',
      'https://picsum.photos/seed/funews8/800/450',
      'Mimarlık ve Şehir Planlama Bölümü Mimari Restorasyon Programı öğrencileri, tarihi Harput Kalesi ve çevresinde kapsamlı bir alan belgeleme çalışması yürüttü.\n\nFotogrametri, el rölövesi ve drone destekli hava fotoğrafçılığı tekniklerini kullanan öğrenciler; kale surları, savunma kuleleri ve tarihi yapı kalıntılarına ait ayrıntılı belgeleme verileri üretti. Toplanan verilerle 3 boyutlu dijital model oluşturuldu ve restorasyon önerileri hazırlandı.\n\nÇalışma, Elazığ Valiliği Kültür ve Turizm İl Müdürlüğünün desteğiyle gerçekleştirildi. Müdürlük yetkilileri, üretilen belgelerin gerçek restorasyon projelerinde referans olarak kullanılabileceğini belirtti.\n\nBölüm danışmanı Öğr. Gör. Canan Öztürk, bu tür alan çalışmalarının programın olmazsa olmaz bir parçası olduğunu vurguladı.',
    ],
    [
      'Otomotiv Teknolojisi Programında elektrikli araç dönüşüm projesi tamamlandı; prototip tanıtıldı',
      '2025-12-08',
      'https://picsum.photos/seed/funews9/800/450',
      'Motorlu Araçlar ve Ulaştırma Teknolojileri Bölümü Otomotiv Teknolojisi Programı öğrencileri, iki dönem boyunca sürdürdükleri "Fosil Yakıtlı Araçtan Elektrikli Araca Dönüşüm" projesini başarıyla tamamladı.\n\nBir adet benzinli hafif ticari araç; elektrik motoru, lityum-iyon batarya paketi ve şarj yönetim sistemi ile donatılarak tam elektrikli araca dönüştürüldü. Prototip, tek şarjda 120 km menzil sunuyor. Araç, okul bahçesinde düzenlenen tanıtım gününde öğretim üyeleri, öğrenciler ve basın mensuplarına sergilendi.\n\nProje danışmanı Öğr. Gör. Serkan Yılmaz, "Öğrencilerimiz bu proje sayesinde elektrikli araç teknolojisinin tüm alt sistemlerini bizzat deneyimledi. Sektör için mükemmel bir saha okulu oldu." dedi.',
    ],
    [
      'TB MYO Bahar Şenliği: Müzik, sergi ve sportif etkinliklerle renkli bir gün yaşandı',
      '2025-11-25',
      'https://picsum.photos/seed/funews10/800/450',
      'Teknik Bilimler Meslek Yüksekokulu, geleneksel Bahar Şenliğini bu yıl da coşkuyla kutladı. Bir gün süren etkinlikte müzik performansları, bölüm sergileri ve spor turnuvaları bir arada yer aldı.\n\nAçılışta öğrenci toplulukları halk müziği ve pop sahne performansları sundu. Ardından bölümlerin hazırladığı proje sergileri ziyaretçilerin ilgisini çekti; Elektronik Bölümünün geliştirdiği akıllı ev prototipi ve Grafik Tasarım öğrencilerinin posterlerinden oluşan galeri büyük beğeni topladı.\n\nÖğleden sonra futbol ve voleybol turnuvaları düzenlendi. Müdür Yrd. Doç. Dr. Fatma Arslan kapanış konuşmasında "Bu etkinlikler öğrencilerimizin akademik başarısını tamamlayan sosyal ve kültürel gelişimleri için çok değerlidir." dedi.',
    ],
    [
      'İnşaat Bölümü öğrencileri şantiye güvenliği eğitiminde bireysel koruyucu ekipman kullanımını öğrendi',
      '2025-11-12',
      'https://picsum.photos/seed/funews11/800/450',
      'İnşaat Bölümü öğrencileri, Türkiye İnşaat Sanayicileri İşveren Sendikası (İNTES) iş birliğiyle düzenlenen Şantiye Güvenliği Uygulamalı Eğitim Programına katıldı.\n\nTam gün süren eğitimde öğrenciler; baret, emniyet kemeri, koruyucu gözlük ve çelik burunlu bot gibi kişisel koruyucu donanımların (KKD) doğru seçimi, kullanımı ve bakımını öğrendi. Ayrıca yüksekte çalışma güvenliği, iskele kurulum standartları ve tehlikeli madde depolama konuları da kapsamlı biçimde işlendi.\n\nEğitimi yürüten iş güvenliği uzmanı Murat Bal, "İnşaat sektöründeki iş kazalarının büyük bölümü KKD kullanılmamasından kaynaklanıyor. Öğrencilerimizin bu bilinci erken edinmesi hayat kurtarır." dedi.',
    ],
    [
      'Uyuşturucu ile mücadele ve bağımlılık önleme farkındalık paneli TB MYO konferans salonunda gerçekleşti',
      '2025-11-07',
      'https://picsum.photos/seed/funews12/800/450',
      'Fırat Üniversitesi Teknik Bilimler MYO, Elazığ İl Emniyet Müdürlüğü Narkotik Suçlarla Mücadele Şubesi ve Elazığ Halk Sağlığı Müdürlüğü ile ortak düzenlediği farkındalık panelinde öğrencileri uyuşturucu bağımlılığının bireysel ve toplumsal sonuçları hakkında bilgilendirdi.\n\nPanel boyunca narkotik uzmanları madde bağımlılığının fizyolojik etkilerini, bağımlılıktan korunma yollarını ve sosyal baskı altında doğru karar vermeyi anlattı. Klinisyen psikolog da bağımlılığa karşı psikolojik direnç geliştirme stratejilerini paylaştı.\n\nOkul Müdürü Prof. Dr. Recep Tekin kapanışta "Gençlerimizi bilgilendirmek en etkili koruma yöntemdir. Bu tür etkinlikleri düzenli aralıklarla sürdüreceğiz." dedi.',
    ],
    [
      'Radyo ve Televizyon Programcılığı öğrencileri FÜ Kampüs Radyosu için canlı yayın deneyimi kazandı',
      '2025-10-22',
      'https://picsum.photos/seed/funews13/800/450',
      'Görsel-İşitsel Teknikler ve Medya Yapımcılığı Bölümü Radyo ve Televizyon Programcılığı öğrencileri, Fırat Üniversitesi Kampüs Radyosu stüdyosunda bir hafta boyunca canlı yayın deneyimi yaşadı.\n\nÖğrenciler; yayın öncesi içerik planlaması, mikrofon tekniği, müzik seçimi, haber bülteni hazırlama ve dinleyici hat yönetimi konularında bizzat sorumluluk üstlenerek her sabah 08.00-10.00 saatleri arasında üniversite genelinde yayın yaptı.\n\nBölüm koordinatörü Öğr. Gör. Serap Doğan, "Stüdyo ortamı akademik bilgiyi canlıya taşımak için eşsiz bir fırsat. Öğrencilerimiz hem heyecanı hem de profesyonellik gerektiren sorumluluğu bu haftada bir arada yaşadı." dedi.\n\nDeneyim, öğrencilerin portfolyo çalışmalarına katkı sağlamak amacıyla kayıt altına alındı.',
    ],
    [
      'Elektrik ve Enerji Bölümünde güneş enerjisi laboratuvarı kurulumu tamamlandı',
      '2025-10-10',
      'https://picsum.photos/seed/funews14/800/450',
      'Elektrik ve Enerji Bölümünün yeni Yenilenebilir Enerji Laboratuvarı, Fırat Üniversitesi Rektörünün katıldığı bir törenle hizmete açıldı.\n\nLaboratuvarda 10 adet monokristal güneş paneli, MPPT şarj kontrol ünitesi, batarya depolama sistemi ve grid bağlantı invertörü yer alıyor. Kurulum, Avrupa Birliği Erasmus+ programı kapsamında edinilen ekipman hibesinin katkısıyla gerçekleştirildi.\n\nÖğrenciler artık; panel verimlilik ölçümü, gölgeleme etkisi analizi, batarya şarj-deşarj eğrisi ve şebeke bağlantı simülasyonu gibi gerçek sistem deneyleri yapabiliyor.\n\nBölüm Başkanı Doç. Dr. Ali Kaya, "Bu laboratuvar öğrencilerimize yenilenebilir enerji alanında somut saha bilgisi kazandıracak ve mezuniyetlerinde rekabetçi olmalarını sağlayacak." dedi.',
    ],
    [
      'İç Mekan Tasarım Programı öğrencilerinin bitirme projeleri uluslararası tasarım platformunda yayımlandı',
      '2025-09-30',
      'https://picsum.photos/seed/funews15/800/450',
      'TB MYO Tasarım Bölümü İç Mekan Tasarım Programı öğrencilerinin 2024-2025 akademik yılı bitirme projeleri, uluslararası tasarım topluluğu platformu Behance üzerinde yayımlandı ve kısa sürede geniş kitlelere ulaştı.\n\nOtuz öğrencinin hazırladığı projeler; küçük alan optimizasyonu, erişilebilir tasarım, biyofilik iç mekanlar ve akıllı aydınlatma sistemleri gibi güncel temalar üzerine yoğunlaştı. Projeler toplamda 4.200 den fazla görüntülenme aldı ve bazı öğrenciler uluslararası tasarım firmaları tarafından iletişime geçildi.\n\nBölüm koordinatörü Öğr. Gör. Nazan Yurt, "Dijital portföy oluşturmayı müfredatımızın bir parçası haline getirdik. Öğrencilerimizin uluslararası görünürlük kazanması en büyük hedefimizdi, bunu başardık." dedi.',
    ],
  ];

  await pool.query(
    'INSERT INTO news (title, `date`, image_url, content) VALUES ?',
    [samples]
  );
}

async function ensureQuickLinksTableAndSeed() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quick_links (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      subtitle VARCHAR(500) NULL,
      url VARCHAR(2000) NOT NULL,
      icon_name VARCHAR(80) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await pool.query(
      'ALTER TABLE quick_links MODIFY COLUMN subtitle VARCHAR(500) NULL'
    );
  } catch (e) {
    /* sütun yoksa veya aynıysa yoksay */
  }

  const [countRows] = await pool.query('SELECT COUNT(*) AS c FROM quick_links');
  const count = countRows[0]?.c ?? 0;
  if (count === 0 || FORCE_SYNC_FROM_WEB) {
    await syncQuickLinksFromWeb();
  }
}

/**
 * Metinler teknik.firat.edu.tr ve www.firat.edu.tr resmi sayfalarına göre düzenlenir.
 * Sunucu her açılışta güncel buton içeriklerini yazar (id sabit kalır).
 */
async function syncQuickLinksFromWeb() {
  const rows = [
    [
      1,
      'OBS — Öğrenci Bilgi Sistemi',
      'Not görüntüleme, ders kaydı ve akademik işlemler. TB MYO “e-Hizmetler” bölümünde de Öğrenci İşleri Otomasyonu olarak geçer.',
      'https://obs.firat.edu.tr/',
      'school',
      1,
    ],
    [
      2,
      'Uzaktan Eğitim (UZEM)',
      'Fırat Üniversitesi uzaktan eğitim platformu; canlı ders ve ders materyallerine erişim.',
      'https://uzem.firat.edu.tr/',
      'cast',
      2,
    ],
    [
      3,
      'Kurumsal E-posta',
      'Öğrenci ve personel e-posta erişimi (Fırat Üniversitesi ana sayfa Hızlı Linkler).',
      'https://posta.firat.edu.tr/',
      'email',
      3,
    ],
    [
      4,
      'TB MYO Resmi Web',
      'Teknik Bilimler MYO ana sayfa: duyurular, birimden haberler, bölüm/programlar ve hızlı erişim menüsü.',
      'https://teknik.firat.edu.tr/tr',
      'language',
      4,
    ],
    [
      5,
      'Tüm Duyurular',
      'Birim duyuruları: staj, ders kaydı, yatay geçiş, ders programları vb. (TB MYO duyuru arşivi).',
      'https://teknik.firat.edu.tr/tr/announcements-all',
      'campaign',
      5,
    ],
    [
      6,
      'Birim Haberleri',
      'Teknik Bilimler MYO haber ve etkinlik duyurularının tam listesi.',
      'https://teknik.firat.edu.tr/tr/news-all',
      'article',
      6,
    ],
    [
      7,
      'Staj Dökümanları',
      'Programlar, e-hizmet bağlantıları (OBS, uzaktan eğitim), akademik takvim PDF ve staj ile ilgili belgeler.',
      'https://teknik.firat.edu.tr/tr/internship-document',
      'assignment',
      7,
    ],
    [
      8,
      'Akademik Takvim (PDF)',
      '2025–2026 Akademik Yılı — Fırat Üniversitesi resmi akademik takvim belgesi (PDF).',
      'https://www.firat.edu.tr/documents/1756819266.pdf',
      'date-range',
      8,
    ],
    [
      9,
      'Fırat Üniversitesi Ana Sayfa',
      'Üniversite duyuruları, haberler, etkinlikler; EBYS, Kütüphane, Kariyer ve diğer kurumsal bağlantılar.',
      'https://www.firat.edu.tr/tr',
      'public',
      9,
    ],
  ];

  await pool.query('DELETE FROM quick_links');
  await pool.query(
    'INSERT INTO quick_links (id, title, subtitle, url, icon_name, sort_order) VALUES ?',
    [rows]
  );
  await pool.query('ALTER TABLE quick_links AUTO_INCREMENT = 10');
}

/**
 * Bölüm ve önlisans programları — yapı teknik.firat.edu.tr “Bölümlerimiz” menüsüyle uyumludur.
 * @see https://teknik.firat.edu.tr/
 */
const DEPARTMENT_PROGRAMS = {
  1: ['Bilgisayar Programcılığı Programı', 'Bilgisayar Programcılığı (Uzaktan Öğretim) Programı'],
  2: ['Elektrik Programı', 'Hibrid ve Elektrikli Taşıtlar Teknolojisi Programı'],
  3: [
    'Biyomedikal Cihaz Teknolojisi Programı',
    'Elektronik Teknolojisi Programı',
    'Mekatronik Programı',
  ],
  4: ['Radyo ve Televizyon Programcılığı Programı'],
  5: ['İnşaat Teknolojisi Programı'],
  6: ['Makine Programı'],
  7: ['Mimari Restorasyon Programı'],
  8: ['Otomotiv Teknolojisi Programı'],
  9: ['İş Sağlığı ve Güvenliği Programı'],
  10: ['Grafik Tasarım Programı', 'İç Mekan Tasarım Programı'],
};

const OFFICIAL_DEPARTMENTS = [
  [
    1,
    'Bilgisayar Teknolojileri Bölümü',
    'computer',
    1,
    `Bilgisayar Teknolojileri Bölümü; yazılım geliştirme, sistem ve ağ temelleri, veri ile siber güvenlik odaklı uygulamalı öğretim sunar. Staj ve laboratuvar çalışmalarıyla sektörün ihtiyaç duyduğu ara eleman yetiştirilmesini hedefler.`,
  ],
  [
    2,
    'Elektrik ve Enerji Bölümü',
    'bolt',
    2,
    `Elektrik ve Enerji Bölümü; elektrik tesisleri, enerji kullanımı ve hibrid/elektrikli taşıt teknolojilerinde saha bilgisi ve güvenli iş uygulamalarına yönelik programlar içerir.`,
  ],
  [
    3,
    'Elektronik ve Otomasyon Bölümü',
    'memory',
    3,
    `Elektronik ve Otomasyon Bölümü; elektronik sistemler, endüstriyel otomasyon, mekatronik ve biyomedikal cihaz alanlarında donanım–yazılım bütünlüğüyle öğrenme ortamı sağlar.`,
  ],
  [
    4,
    'Görsel-İşitsel Teknikler ve Medya Yapımcılığı Bölümü',
    'movie',
    4,
    `Görsel-işitsel üretim, kamera, kurgu ve yayıncılık süreçlerinde mesleki içerikler sunar; medya sektörüne yönelik uygulamalı beceriler ön plandadır.`,
  ],
  [
    5,
    'İnşaat Bölümü',
    'apartment',
    5,
    `İnşaat Bölümü; yapı elemanları, ölçü, malzeme, şantiye uygulamaları ve iş güvenliği konularında temel teknik yeterlik kazandırır.`,
  ],
  [
    6,
    'Makine ve Metal Teknolojileri Bölümü',
    'build',
    6,
    `Makine ve Metal Teknolojileri Bölümü; üretim, metal işleme, bakım-onarım ve makine güvenliği odaklı atölye ve laboratuvar uygulamaları içerir.`,
  ],
  [
    7,
    'Mimarlık ve Şehir Planlama Bölümü',
    'architecture',
    7,
    `Mimarlık ve Şehir Planlama Bölümü; mimari koruma/restorasyon alanında mesleki programa yönelik teknik çizim, malzeme ve koruma ilkelerini kapsayan içerikler sunar.`,
  ],
  [
    8,
    'Motorlu Araçlar ve Ulaştırma Teknolojileri Bölümü',
    'directions-car',
    8,
    `Motorlu Araçlar ve Ulaştırma Teknolojileri Bölümü; otomotiv teknolojisi üzerinden motor, şanzıman, elektrifikasyon ve bakım-onarımda sahaya dönük eğitim verir.`,
  ],
  [
    9,
    'Mülkiyet Koruma ve Güvenlik Bölümü',
    'security',
    9,
    `Mülkiyet Koruma ve Güvenlik ile İş Sağlığı ve Güvenliği programları; güvenlik hizmetleri, risk yönetimi ve sahada güvenli çalışma kültürü becerilerini destekler.`,
  ],
  [
    10,
    'Tasarım Bölümü',
    'palette',
    10,
    `Tasarım Bölümü; grafik tasarım ve iç mekan tasarımına yönelik yaratıcı proje geliştirme, görsel iletişim ve dijital üretim araçlarını kullanmayı içerir.`,
  ],
];

async function ensureDepartmentsTableAndSeed() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      icon_name VARCHAR(80) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      description TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await pool.query('ALTER TABLE departments ADD COLUMN description TEXT NULL');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e;
  }

  const [countRows] = await pool.query('SELECT COUNT(*) AS c FROM departments');
  const count = countRows[0]?.c ?? 0;
  if (count === 0 || FORCE_SYNC_FROM_WEB) {
    await syncDepartmentsFromOfficial();
  }
}

/** Her başlangıçta teknik.firat yapısıyla bölüm tablosunu eşler (liste ve id’ler uygulamayla tutarlı kalsın). */
async function syncDepartmentsFromOfficial() {
  await pool.query('DELETE FROM departments');
  await pool.query(
    'INSERT INTO departments (id, name, icon_name, sort_order, description) VALUES ?',
    [OFFICIAL_DEPARTMENTS]
  );
  await pool.query('ALTER TABLE departments AUTO_INCREMENT = 11');
}

async function ensureAnnouncementHighlightsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcement_highlights (
      id INT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      teaser VARCHAR(600) NULL,
      url VARCHAR(2000) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [countRows] = await pool.query('SELECT COUNT(*) AS c FROM announcement_highlights');
  const count = countRows[0]?.c ?? 0;
  if (count === 0 || FORCE_SYNC_FROM_WEB) {
    await syncAnnouncementHighlightsFromWeb();
  }
}

/**
 * Ana sayfadaki güncel duyuru başlıklarıyla özet satırları; detay metni her zaman teknik.firat.edu.tr üzerindedir.
 */
async function syncAnnouncementHighlightsFromWeb() {
  const rows = [
    [
      1,
      '2025-2026 Bahar Yarıyılı Mazeret Sınav Duyurusu',
      'TB MYO ana sayfa duyuru alanı — tam metin ve ekler için duyurular sayfasına gidin.',
      'https://teknik.firat.edu.tr/tr/announcements-all',
      1,
    ],
    [
      2,
      '2025-2026 Bahar Yarıyılı Ara Sınav Programları',
      'Sınav programı ve güncellemeler okul web sitesinde yayımlanır.',
      'https://teknik.firat.edu.tr/tr/announcements-all',
      2,
    ],
    [
      3,
      '2026 Staj Duyurusu',
      'Staj başvuru ve belgeler için duyuru metnini siteden takip edin.',
      'https://teknik.firat.edu.tr/tr/announcements-all',
      3,
    ],
    [
      4,
      'Sosyal Seçmeli Derslerin (SSD) İşleneceği Yerler',
      'SSD yerleşim bilgileri duyurular bölümünde paylaşılır.',
      'https://teknik.firat.edu.tr/tr/announcements-all',
      4,
    ],
    [
      5,
      'Ders Kayıt Duyurusu',
      'OBS ve ders kayıt takvimi ile ilgili resmi duyurular.',
      'https://teknik.firat.edu.tr/tr/announcements-all',
      5,
    ],
    [
      6,
      'Tüm duyurular',
      'Yatay geçiş, sınav, staj ve diğer tüm birim duyurularının listesi.',
      'https://teknik.firat.edu.tr/tr/announcements-all',
      6,
    ],
  ];

  await pool.query('DELETE FROM announcement_highlights');
  await pool.query(
    'INSERT INTO announcement_highlights (id, title, teaser, url, sort_order) VALUES ?',
    [rows]
  );
}

async function ensureContactTableAndSeed() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_info (
      id INT PRIMARY KEY,
      lead_text VARCHAR(800) NOT NULL,
      email VARCHAR(200) NOT NULL,
      phone VARCHAR(120) NOT NULL,
      address VARCHAR(600) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await pool.query(
      'ALTER TABLE contact_info MODIFY COLUMN lead_text VARCHAR(800) NOT NULL'
    );
  } catch (e) {
    /* yoksa yoksay */
  }

  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM contact_info');
  if ((rows[0]?.n ?? 0) > 0) return;

  await pool.query(
    `INSERT INTO contact_info (id, lead_text, email, phone, address) VALUES (?, ?, ?, ?, ?)`,
    [
      1,
      'Aşağıdaki bağlantılar Fırat Üniversitesi ve Teknik Bilimler MYO resmi web sayfalarındaki (teknik.firat.edu.tr, firat.edu.tr) e-hizmet ve duyuru kanallarına yönlendirir.',
      'tbmyo@firat.edu.tr',
      '0 (424) 237 00 00',
      'Fırat Üniversitesi Teknik Bilimler MYO, Üniversite, 23119 Merkez/Elazığ',
    ]
  );
}

async function syncContactLeadFromWeb() {
  const lead =
    'Aşağıdaki bağlantılar Fırat Üniversitesi ve Teknik Bilimler MYO resmi web sayfalarındaki (teknik.firat.edu.tr, firat.edu.tr) e-hizmet ve duyuru kanallarına yönlendirir.';
  await pool.query(
    'UPDATE contact_info SET lead_text = ? WHERE id = 1 AND (lead_text IS NULL OR lead_text = "")',
    [lead]
  );
}

async function syncContactDetailsFromWeb() {
  /** Teknik Bilimler MYO iletişim — teknik.firat.edu.tr alt bilgi alanıyla uyumlu. */
  const [r] = await pool.query('SELECT COUNT(*) AS n FROM contact_info WHERE id = 1');
  if ((r[0]?.n ?? 0) === 0) return;

  const campusAddress =
    'Fırat Üniversitesi Teknik Bilimler MYO, Üniversite, 23119 Merkez/Elazığ';

  if (FORCE_SYNC_FROM_WEB) {
    await pool.query(
      `UPDATE contact_info
       SET phone = ?, address = ?, email = ?
       WHERE id = 1`,
      ['90 (424) 237 00 00', campusAddress, 'tbmyo@firat.edu.tr']
    );
  }

  await pool.query(
    `UPDATE contact_info
     SET address = ?
     WHERE id = 1 AND (
       address LIKE '%Meslek Yüksek Okulu%'
       OR address LIKE '%Meslek Yüksekokulu%'
     )`,
    [campusAddress]
  );
}

async function ensureObsUsersTableAndSeed() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS obs_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(64) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(120) NOT NULL,
      role VARCHAR(40) NOT NULL DEFAULT 'ogrenci',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_obs_users_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [countRows] = await pool.query('SELECT COUNT(*) AS c FROM obs_users');
  const count = countRows[0]?.c ?? 0;
  if (count > 0) return;

  const demoHash = await bcrypt.hash('demo', 10);
  const rows = [
    ['ogrenci_demo', demoHash, 'Demo Öğrenci', 'ogrenci'],
    ['ogretim_demo', demoHash, 'Demo Öğretim Görevlisi', 'ogretim_gorevlisi'],
    ['sistem_demo', demoHash, 'Demo Sistem Yöneticisi', 'sistem_yoneticisi'],
    ['personel_demo', demoHash, 'Demo Personel', 'personel'],
  ];
  await pool.query(
    'INSERT INTO obs_users (username, password_hash, display_name, role) VALUES ?',
    [rows]
  );
}

async function bootstrap() {
  await ensureDatabaseExists();
  await ensureNewsTableAndSeed();
  await ensureQuickLinksTableAndSeed();
  await ensureDepartmentsTableAndSeed();
  await ensureContactTableAndSeed();
  await ensureAnnouncementHighlightsTable();
  await ensureObsUsersTableAndSeed();
  await syncContactLeadFromWeb();
  await syncContactDetailsFromWeb();
}

const app = express();
app.use(cors());
app.use(express.json());

function isAdminAuthorized(req) {
  const token = bearerToken(req);
  if (!token) return false;
  if (token === ADMIN_PASSWORD) return true;
  const payload = verifyObsJwt(token);
  return Boolean(
    payload &&
      Array.isArray(payload.permissions) &&
      payload.permissions.includes('icerik_yonetimi')
  );
}

function requireAdmin(req, res, next) {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Admin yetkisi gerekli.' });
  }
  return next();
}

app.get('/api/news', async (req, res) => {
  try {
    const query = `
      SELECT id, title, \`date\` AS d, image_url
      FROM news
      ORDER BY \`date\` DESC, id DESC
    `;
    const [rows] = await pool.query(query);
    const payload = rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      date: formatDateTR(row.d),
      image_url: row.image_url,
    }));
    res.json(payload);
  } catch (err) {
    console.error('GET /api/news error:', err);
    res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Haberleri çekerken veritabanı hatası oluştu.',
      details: err?.message ?? String(err),
    });
  }
});

app.get('/api/news/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ error: 'INVALID_ID', message: 'Geçersiz haber kimliği.' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, title, `date` AS d, image_url, content FROM news WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Haber bulunamadı.' });
    }
    const row = rows[0];
    res.json({
      id: String(row.id),
      title: row.title,
      date: formatDateTR(row.d),
      image_url: row.image_url,
      content: row.content ?? '',
    });
  } catch (err) {
    console.error('GET /api/news/:id error:', err);
    res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Haber detayı alınamadı.',
      details: err?.message ?? String(err),
    });
  }
});

app.get('/api/quick-links', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, subtitle, url, icon_name, sort_order
       FROM quick_links
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        title: r.title,
        subtitle: r.subtitle,
        url: r.url,
        icon_name: r.icon_name,
      }))
    );
  } catch (err) {
    console.error('GET /api/quick-links error:', err);
    res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Hızlı erişim verisi alınamadı.',
      details: err?.message ?? String(err),
    });
  }
});

app.get('/api/departments', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, icon_name, sort_order
       FROM departments
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        icon_name: r.icon_name,
      }))
    );
  } catch (err) {
    console.error('GET /api/departments error:', err);
    res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Bölüm verisi alınamadı.',
      details: err?.message ?? String(err),
    });
  }
});

app.get('/api/departments/:id', async (req, res) => {
  const rawId = req.params.id;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ error: 'INVALID_ID', message: 'Geçersiz bölüm kimliği.' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT id, name, icon_name, sort_order, description
       FROM departments
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Bölüm bulunamadı.' });
    }
    const r = rows[0];
    const programs = DEPARTMENT_PROGRAMS[id] ?? [];
    res.json({
      id: String(r.id),
      name: r.name,
      icon_name: r.icon_name,
      description: r.description ?? '',
      programs,
    });
  } catch (err) {
    console.error('GET /api/departments/:id error:', err);
    res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Bölüm detayı alınamadı.',
      details: err?.message ?? String(err),
    });
  }
});

app.get('/api/contact', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT lead_text, email, phone, address FROM contact_info WHERE id = 1 LIMIT 1`
    );
    if (!rows.length) {
      return res.json({
        lead_text: '',
        email: '',
        phone: '',
        address: '',
        footer_text: '',
      });
    }
    const r = rows[0];
    const footerText = `İletişim: ${r.email} | Tel: ${r.phone} | ${r.address}`;
    res.json({
      lead_text: r.lead_text,
      email: r.email,
      phone: r.phone,
      address: r.address,
      footer_text: footerText,
    });
  } catch (err) {
    console.error('GET /api/contact error:', err);
    res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'İletişim bilgisi alınamadı.',
      details: err?.message ?? String(err),
    });
  }
});

app.get('/api/announcements/highlights', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, teaser, url, sort_order
       FROM announcement_highlights
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(
      rows.map((row) => ({
        id: String(row.id),
        title: row.title,
        teaser: row.teaser ?? '',
        url: row.url,
      }))
    );
  } catch (err) {
    console.error('GET /api/announcements/highlights error:', err);
    res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Duyuru listesi alınamadı.',
      details: err?.message ?? String(err),
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const username = String(req.body?.username || '')
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || '');
  if (!username || !password) {
    return res.status(400).json({
      error: 'INVALID_BODY',
      message: 'Kullanıcı adı ve şifre gerekli.',
    });
  }
  try {
    const [rows] = await pool.query(
      `SELECT id, username, password_hash, display_name, role
       FROM obs_users
       WHERE username = ?
       LIMIT 1`,
      [username]
    );
    if (!rows.length) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Kullanıcı adı veya şifre hatalı.',
      });
    }
    const row = rows[0];
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Kullanıcı adı veya şifre hatalı.',
      });
    }
    const permissions = permissionsForRole(row.role);
    const token = signObsJwt(row);
    return res.json({
      token,
      user: {
        id: String(row.id),
        username: row.username,
        display_name: row.display_name,
        role: row.role,
        permissions,
      },
    });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    return res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Giriş sırasında hata oluştu.',
      details: err?.message ?? String(err),
    });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const token = bearerToken(req);
  const payload = verifyObsJwt(token);
  if (!payload?.sub) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi doldu.' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT id, username, display_name, role FROM obs_users WHERE id = ? LIMIT 1`,
      [payload.sub]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Kullanıcı bulunamadı.' });
    }
    const row = rows[0];
    const permissions = permissionsForRole(row.role);
    return res.json({
      user: {
        id: String(row.id),
        username: row.username,
        display_name: row.display_name,
        role: row.role,
        permissions,
      },
    });
  } catch (err) {
    console.error('GET /api/auth/me error:', err);
    return res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Oturum doğrulanamadı.',
      details: err?.message ?? String(err),
    });
  }
});

app.get('/api/about', (_req, res) => {
  res.json({
    headline: 'Teknik Bilimler Meslek Yüksekokulu',
    university: 'Fırat Üniversitesi',
    intro:
      'Teknik Bilimler MYO; önlisans düzeyinde mühendislik ve teknik alanlarda eğitim veren birimdir. Güncel duyurular, akademik takvim, e-hizmetler ve bölüm/program yapısı resmi web sitesinde yayımlanır.',
    source_label: 'Bilgi kaynağı',
    source_url: 'https://teknik.firat.edu.tr/',
    sections: [
      {
        title: 'Resmi site',
        url: 'https://teknik.firat.edu.tr/tr',
        description: 'Ana sayfa, duyurular ve birim haberleri.',
      },
      {
        title: 'Hakkımızda',
        url: 'https://teknik.firat.edu.tr/tr',
        description:
          'Müdürün mesajı, misyon-vizyon, organizasyon şeması ve birim içerikleri site menüsünden erişilir.',
      },
      {
        title: 'e-Hizmetler',
        url: 'https://teknik.firat.edu.tr/tr',
        description:
          'Öğrenci İşleri Otomasyonu (OBS), uzaktan eğitim, akademik takvim ve formlar site üzerinden sunulur.',
      },
    ],
  });
});

app.post('/api/admin/login', (req, res) => {
  const password = String(req.body?.password || '');
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Şifre hatalı.' });
  }
  return res.json({ token: ADMIN_PASSWORD });
});

app.get('/api/admin/bootstrap', requireAdmin, async (_req, res) => {
  try {
    const [newsRows] = await pool.query(
      'SELECT id, title, `date`, image_url FROM news ORDER BY `date` DESC, id DESC'
    );
    const [quickRows] = await pool.query(
      `SELECT id, title, subtitle, url, icon_name, sort_order
       FROM quick_links
       ORDER BY sort_order ASC, id ASC`
    );
    const [announcementRows] = await pool.query(
      `SELECT id, title, teaser, url, sort_order
       FROM announcement_highlights
       ORDER BY sort_order ASC, id ASC`
    );
    const [contactRows] = await pool.query(
      'SELECT lead_text, email, phone, address FROM contact_info WHERE id = 1 LIMIT 1'
    );
    res.json({
      news: newsRows,
      quick_links: quickRows,
      announcements: announcementRows,
      contact:
        contactRows[0] || { lead_text: '', email: '', phone: '', address: '' },
    });
  } catch (err) {
    console.error('GET /api/admin/bootstrap error:', err);
    res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Admin verileri alınamadı.',
      details: err?.message ?? String(err),
    });
  }
});

app.put('/api/admin/news', requireAdmin, async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
  if (!rows) {
    return res.status(400).json({ error: 'INVALID_BODY', message: 'rows dizisi gerekli.' });
  }
  const values = rows
    .filter((r) => r && r.title && r.date && r.image_url)
    .map((r) => [String(r.title).trim(), String(r.date).slice(0, 10), String(r.image_url).trim()]);
  try {
    await pool.query('DELETE FROM news');
    if (values.length) {
      await pool.query('INSERT INTO news (title, `date`, image_url) VALUES ?', [values]);
    }
    res.json({ ok: true, count: values.length });
  } catch (err) {
    console.error('PUT /api/admin/news error:', err);
    res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Haberler güncellenemedi.',
      details: err?.message ?? String(err),
    });
  }
});

app.put('/api/admin/quick-links', requireAdmin, async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
  if (!rows) {
    return res.status(400).json({ error: 'INVALID_BODY', message: 'rows dizisi gerekli.' });
  }
  const values = rows
    .filter((r) => r && r.title && r.url)
    .map((r, index) => [
      index + 1,
      String(r.title).trim(),
      r.subtitle ? String(r.subtitle).trim() : '',
      String(r.url).trim(),
      r.icon_name ? String(r.icon_name).trim() : 'link',
      Number.isFinite(Number(r.sort_order)) ? Number(r.sort_order) : index + 1,
    ]);
  try {
    await pool.query('DELETE FROM quick_links');
    if (values.length) {
      await pool.query(
        'INSERT INTO quick_links (id, title, subtitle, url, icon_name, sort_order) VALUES ?',
        [values]
      );
    }
    res.json({ ok: true, count: values.length });
  } catch (err) {
    console.error('PUT /api/admin/quick-links error:', err);
    res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Hızlı erişim listesi güncellenemedi.',
      details: err?.message ?? String(err),
    });
  }
});

app.put('/api/admin/announcements', requireAdmin, async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
  if (!rows) {
    return res.status(400).json({ error: 'INVALID_BODY', message: 'rows dizisi gerekli.' });
  }
  const values = rows
    .filter((r) => r && r.title && r.url)
    .map((r, index) => [
      index + 1,
      String(r.title).trim(),
      r.teaser ? String(r.teaser).trim() : '',
      String(r.url).trim(),
      Number.isFinite(Number(r.sort_order)) ? Number(r.sort_order) : index + 1,
    ]);
  try {
    await pool.query('DELETE FROM announcement_highlights');
    if (values.length) {
      await pool.query(
        'INSERT INTO announcement_highlights (id, title, teaser, url, sort_order) VALUES ?',
        [values]
      );
    }
    res.json({ ok: true, count: values.length });
  } catch (err) {
    console.error('PUT /api/admin/announcements error:', err);
    res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Duyuru listesi güncellenemedi.',
      details: err?.message ?? String(err),
    });
  }
});

app.put('/api/admin/contact', requireAdmin, async (req, res) => {
  const lead_text = String(req.body?.lead_text || '').trim();
  const email = String(req.body?.email || '').trim();
  const phone = String(req.body?.phone || '').trim();
  const address = String(req.body?.address || '').trim();
  if (!lead_text || !email || !phone || !address) {
    return res.status(400).json({ error: 'INVALID_BODY', message: 'Tüm alanlar zorunlu.' });
  }
  try {
    await pool.query(
      `UPDATE contact_info
       SET lead_text = ?, email = ?, phone = ?, address = ?
       WHERE id = 1`,
      [lead_text, email, phone, address]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/admin/contact error:', err);
    res.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'İletişim bilgisi güncellenemedi.',
      details: err?.message ?? String(err),
    });
  }
});

const PORT = 3000;

bootstrap()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API çalışıyor: http://localhost:${PORT}`);
      console.log('Emülatör: Android 10.0.2.2:3000 | iOS localhost:3000');
    });
  })
  .catch((err) => {
    console.error('Sunucu başlatılamadı:', err);
    process.exit(1);
  });
