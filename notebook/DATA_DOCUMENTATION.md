# 🗑️ Atık Toplama Optimizasyonu Hackathon - Veri Seti Dokümantasyonu

## 📋 Genel Bakış

Bu veri seti, Bursa Nilüfer Belediyesi'nin atık toplama operasyonlarına ait gerçek verileri içermektedir. Veriler, araç filo yönetimi, GPS takip kayıtları, konteyner envanteri, mahalle bazlı demografik bilgiler ve atık tonaj istatistiklerini kapsamaktadır.

**Veri Dönemi:** Aralık 2024 - Aralık 2025  
**Toplam Dosya Sayısı:** 10  
**Toplam Veri Boyutu:** ~147 MB  
**Kapsanan Alan:** Bursa Nilüfer İlçesi (64 mahalle)

---

## 📊 Veri Setleri Detayları

### 1. `fleet.csv` - Araç Filosu Bilgileri
**Boyut:** 2 KB | **Kayıt Sayısı:** 46 araç

Atık toplama filosundaki tüm araçların detaylı bilgilerini içerir.

#### Sütunlar:
| Sütun | Veri Tipi | Açıklama | Örnek Değer |
|-------|-----------|----------|-------------|
| `vehicle_name` | String | Araç kimlik adı | "Vehicle 1" |
| `vehicle_id` | String | Benzersiz 4 haneli araç ID | "2824" |
| `vehicle_type` | String | Araç tipi kategorisi | "Large Garbage Truck", "Crane Vehicle", "Small Garbage Truck" |
| `capacity_m3` | Float | Araç hacim kapasitesi (metreküp) | 16.5, 23.0, 9.0 |
| `capacity_ton` | Float | Araç ağırlık kapasitesi (ton) | 7.8, 11.8, 4.8 |

#### Özellikler:
- **3 araç tipi** mevcut: Vinçli Araç (23m³), Büyük Kamyon (16.5m³), Küçük Kamyon (9m³)
- Her araç için benzersiz ID ve isim bilgisi

#### Kullanım Alanları:
- Rota planlamasında araç kapasitesi kısıtlamaları
- Araç-tip bazlı optimizasyon
- Filo büyüklüğü analizi

---

### 2. `truck_types.csv` - Araç Tipleri ve Kapasite Aralıkları
**Boyut:** 139 Bytes | **Kayıt Sayısı:** 3 tip

Araç tiplerinin standart kapasite bilgilerini içerir.

#### Sütunlar:
| Sütun | Veri Tipi | Açıklama | Örnek Değer |
|-------|-----------|----------|-------------|
| `vehicle_type` | String | Araç tipi | "Crane Vehicle" |
| `capacity_m3` | Float | Standart hacim kapasitesi | 23.0 |
| `capacity_ton_min` | Integer | Minimum ton kapasitesi | 10 |
| `capacity_ton_max` | Integer | Maksimum ton kapasitesi | 13 |

#### Araç Tipleri:
1. **Crane Vehicle (Vinçli Araç):** Yeraltı/yerüstü büyük konteynerler için
2. **Large Garbage Truck:** Geniş caddeler ve ana arterler
3. **Small Garbage Truck:** Dar sokaklar ve çıkmaz

---

### 3. `all_merged_data.csv` - GPS Takip Kayıtları
**Boyut:** 113 MB | **Kayıt Sayısı:** 634,298 GPS noktası

Araç filosunun detaylı GPS takip verileri. Her bir GPS kaydı, araç konumu, hız, durum ve adres bilgilerini içerir.

#### Sütunlar:
| Sütun | Veri Tipi | Açıklama | Örnek Değer |
|-------|-----------|----------|-------------|
| `#` | Integer | Kayıt sıra numarası | 1 |
| `vehicle_id` | String | Araç ID (fleet.csv ile eşleşir) | "2824" |
| `Enlem` | Float | GPS enlem koordinatı | 40.190456 |
| `Boylam` | Float | GPS boylam koordinatı | 28.9307 |
| `Duraklama Süresi` | Time | Toplam duraklama süresi | "04:39:50" |
| `Rölanti Süresi` | Time | Motor rölanti süresi | "00:05:00" |
| `Yükseklik` | Integer | Rakım (metre) | 103 |
| `Durum` | String | Araç durumu | "Duran", "Hareketli" |
| `Açıklama` | String | Özel durum açıklaması | "Hareket Alarmı" |
| `Tarih` | Date | Kayıt tarihi | "19.12.2025" |
| `Saat` | Time | Kayıt saati | "00:00:49" |
| `Gun` | String | Haftanın günü | "Cuma" |
| `Hız(km/sa)` | Float | Anlık hız | 0.0 |
| `Mesafe(km)` | Float | Segement mesafe | 0.0 |
| `Mesafe Sayacı(km)` | Float | Toplam mesafe sayacı | 98749.16 |
| `Adres` | String | Coğrafi adres | "Alaaddinbey Mh., Nilüfer, Bursa" |
| `Mahalle` | String | Mahalle adı | "Alaaddinbey Mh." |
| `Kaynak` | String | Veri kaynağı | "Log", "Program" |

#### Özellikler:
- **Zaman aralığı:** Aralık 2025
- **Veri frekansı:** Yaklaşık 10 saniyede bir GPS kaydı
- **Kapsam:** 46 araç için detaylı hareket verileri
- **Durum kodları:** Duran, Hareketli, Kontak Açıldı/Kapandı, çeşitli alarm tipleri

#### Kullanım Alanları:
- Gerçekleşen rota analizi
- Duraklama noktalarının tespiti
- Hız analizi ve yakıt optimizasyonu
- Mahalle bazlı hizmet süreleri
- Zaman serisi analizi ve tahminleme

---

### 4. `container_counts.csv` - Mahalle Bazlı Konteyner Envanteri
**Boyut:** 1.9 KB | **Kayıt Sayısı:** 64 mahalle

Her mahallede bulunan farklı tipteki konteyner sayılarını içerir.

#### Sütunlar:
| Sütun | Veri Tipi | Açıklama | Örnek Değer |
|-------|-----------|----------|-------------|
| `SIRA NO` | Integer | Sıra numarası | 1 |
| `MAHALLE` | String | Mahalle adı | "100. YIL" |
| `YERALTI KONTEYNER` | Integer | Yeraltı konteyner sayısı | 124 |
| `770 LT KONTEYNER` | Integer | 770 litre konteyner sayısı | 30 |
| `400 LT KONTEYNER` | Integer | 400 litre konteyner sayısı | 120 |
| `PLASTİK` | Integer/String | Plastik konteyner sayısı | 288, "YER ÇÖPÜ" |
| `TOPLAM` | Integer | Toplam konteyner sayısı | 274 |

#### Özellikler:
- **Konteyner tipleri:** Yeraltı, 770L, 400L, Plastik
- **Toplam konteyner:** 30,000+ konteyner
- **Özel durumlar:** Gölyazı mahallesi "YER ÇÖPÜ" sistemi kullanıyor
- **Dağılım:** Mahalleler arası büyük fark (23 ile 2,590 arası)

#### Kullanım Alanları:
- Konteyner yoğunluğu haritalaması
- Araç tipi seçimi (vinçli araç gereksinimi)
- Rota optimizasyonu için toplama noktası sayısı
- Kapasite planlaması

---

### 5. `mahalle_nufus.csv` - Mahalle Nüfus Bilgileri
**Boyut:** 1.8 KB | **Kayıt Sayısı:** 65 mahalle

Mahalle bazlı nüfus verileri.

#### Sütunlar:
| Sütun | Veri Tipi | Açıklama | Örnek Değer |
|-------|-----------|----------|-------------|
| `mahalle` | String | Mahalle adı | "19 MAYIS MAHALLESİ" |
| `nufus` | Integer | Nüfus (kişi) | 4371 |

#### Özellikler:
- **Toplam nüfus:** Yaklaşık 560,000 kişi
- **Nüfus aralığı:** 92 (ÜÇPINAR) - 32,489 (GÖRÜKLE)
- En kalabalık mahalleler: Görükle, İhsaniye, Dumlupınar

#### Kullanım Alanları:
- Nüfus yoğunluğu bazlı atık tahminlemesi
- Hizmet önceliklendirme

---

### 6. `neighbor_days_rotations.csv` - Toplama Günleri ve Rotasyonlar
**Boyut:** 5.6 KB | **Kayıt Sayısı:** 69 kayıt (bazı mahalleler çoklu tip)

Mahallelerin atık toplama günleri, kullanılan araç tipleri ve vinç rotasyon bilgileri.

#### Sütunlar:
| Sütun | Veri Tipi | Açıklama | Örnek Değer |
|-------|-----------|----------|-------------|
| `MAHALLE ADI` | String | Mahalle adı | "19 MAYIS MAHALLESİ" |
| `Garbage Truck Type` | String | Kullanılan araç tipi | "Large Garbage Truck" |
| `Days Collected Per Week` | Integer | Haftalık toplama günü sayısı | 3, 6, 7 |
| `Collection Frequency` | String | Toplama günleri | "Monday, Wednesday, Friday" |
| `Is Crane Used` | Boolean | Vinç kullanımı | TRUE/FALSE |
| `Crane rotation days` | Integer | Vinç rotasyon gün sayısı | 0, 6 |

#### Özellikler:
- **Toplama frekansları:** 3, 6, veya 7 gün/hafta
- **Çoğunluk:** Haftada 3 gün toplama
- **Vinç kullanımı:** 17 mahallede vinçli araç gerekli
- **Özel durumlar:** 
  - Gölyazı: Gece toplama
  - Dumlupınar/Görükle: Günlük toplama (7 gün)

#### Kullanım Alanları:
- Rota planlama kısıtlamaları
- Araç tipi ataması
- Vinçli araç rotalama
- Hizmet seviyesi analizi

---

### 7. `tonnages.csv` - Aylık Tonaj İstatistikleri
**Boyut:** 1.2 KB | **Kayıt Sayısı:** 24 ay (Ocak 2024 - Kasım 2025)

Aylık bazda toplanan atık tonajları.

#### Sütunlar:
| Sütun | Veri Tipi | Açıklama | Örnek Değer |
|-------|-----------|----------|-------------|
| `AY` | String | Ay adı | "OCAK" |
| `YIL` | Integer | Yıl | 2024 |
| `Yer Üstü Tonaj (TON)` | Float | Yerüstü konteynerden toplanan | 14435.68 |
| `Yer Altı Tonaj (TON)` | Float | Yeraltı konteynerden toplanan | 1675.53 |
| `Toplam Tonaj (TON)` | Float | Toplam aylık tonaj | 16111.21 |
| `Ortalama Günlük Tonaj (TON)` | Float | Günlük ortalama | 537.04 |

#### Özellikler:
- **Zaman aralığı:** 24 ay süreli veri
- **Mevsimsel değişim:** Yaz aylarında artış gözlemleniyor
- **Ortalama aylık tonaj:** ~17,000 ton
- **Günlük ortalama:** 550-690 ton/gün arası

#### İstatistikler:
- **En yüksek:** Ağustos 2025 (20,703 ton)
- **En düşük:** Şubat 2024 (14,698 ton)
- **Yeraltı oranı:** Yaklaşık %10

#### Kullanım Alanları:
- Mevsimsel talep tahmini
- Kapasite planlaması
- Trend analizi
- Bütçe planlaması

---

### 8. `address_data.csv` - Adres Veritabanı
**Boyut:** 17 MB | **Kayıt Sayısı:** ~150,000 adres kaydı

Nilüfer ilçesindeki adres bilgileri 
### Sütunlar:
- Sokak/Cadde adları
- Mahalle bilgileri
- Koordinat bilgileri
- Bina/Adres detayları

#### Kullanım Alanları:
- Konteyner yerleştirme planlaması
- Servis bölgesi tanımlama
- Coğrafi analiz

---

### 9. `Yol-2025-12-16_11-41-01.xlsx` - Excel Veri Dosyası
**Boyut:** 693 KB

Excel formatında ek veriler (içerik inceleme gerektiriyor).

---

### 10. `Yol-2025-12-16_13-38-47.json` - JSON Veri Dosyası
**Boyut:** 9.1 MB

JSON formatında yapısal veri (yollara ait coğrafi veriler).

---

## 📈 Önerilen Analiz Konuları

### 1. Rota Optimizasyonu
- GPS verilerinden gerçekleşen rotaları analiz etme
- Duraklama sürelerini azaltma
- Mesafe optimizasyonu

### 2. Araç Ataması
- Mahalle-araç tipi eşleştirmesi
- Vinç gereksinimleri analizi
- Kapasite kullanım oranları

### 3. Talep Tahmini
- Nüfus ve konteyner sayısı bazlı tonaj tahmini
- Mevsimsel pattern tespiti
- Haftalık/günlük yük dağılımı

### 4. Performans Analizi
- Araç başına verimlilik
- Mahalle başına hizmet süresi
- Yakıt tüketimi optimizasyonu

### 5. Coğrafi Analiz
- Mahalle yoğunluk haritaları
- Optimal konteyner yerleşimi
- Servis bölgesi segmentasyonu

---

## 📝 Veri Kullanım Önerileri

1. **İlk keşif:** `fleet.csv` ve `neighbor_days_rotations.csv` ile başlayın
2. **Ana analiz:** `all_merged_data.csv` üzerinde GPS tabanlı analizler
3. **Tahminleme:** `tonnages.csv` ile trend analizi
4. **Optimizasyon:** Tüm veri setlerini entegre model geliştirme

---

## 🎯 Hackathon Hedefleri

Bu veri seti ile şunlar başarılabilir:

1. **Akıllı Rota Planlama:** ML/AI tabanlı optimal rota önerileri
2. **Kaynak Optimizasyonu:** Araç ve personel ihtiyacının minimize edilmesi
3. **Tahminsel Bakım:** Araç performans analizi
4. **Çevre Etkisi:** Yakıt tüketimi ve karbon ayak izi azaltma
5. **Vatandaş Memnuniyeti:** Hizmet sürelerinin optimizasyonu

---

## 📞 Destek ve Sorular

Veri seti ile ilgili sorularınız için hackathon organizasyon ekibi ile iletişime geçebilirsiniz.

**Veri Güncellenme Tarihi:** 26 Aralık 2025  
**Versiyon:** 1.0

---

*Bu dokümantasyon hackathon katılımcılarına yol göstermek amacıyla hazırlanmıştır.*
