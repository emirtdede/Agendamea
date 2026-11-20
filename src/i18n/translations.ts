import type { LanguageCode } from './languages';

export interface UiDictionary {
  // Smart views & navigation
  allTasks: string;
  today: string;
  important: string;
  completed: string;
  categories: string;
  uncategorized: string;
  noCategoriesYet: string;
  newCategory: string;
  categoryNamePlaceholder: string;
  searchPlaceholder: string;
  clearSearch: string;
  settings: string;
  sponsor: string;
  collapseSidebar: string;
  expandSidebar: string;
  closeMenu: string;
  openMenu: string;

  // Task counts & status filters
  activeCountLabel: string;
  completedCountLabel: string;
  filterAll: string;
  filterActive: string;
  filterCompleted: string;
  clearCompleted: string;
  sortCustom: string;
  sortPriority: string;
  sortDueDate: string;
  sortNewest: string;
  retry: string;

  // QuickAddBar & Dates (Optional single / range / no date)
  addTaskPlaceholder: string;
  addButton: string;
  addingButton: string;
  applyButton: string;
  cancelButton: string;
  deleteToTrashButton: string;
  dateButton: string;
  startDateLabel: string;
  dueDateLabel: string;
  optionalDateHint: string;
  tomorrow: string;
  yesterday: string;
  overdueSuffix: string;
  clearDate: string;
  instantSaveBadge: string;
  autoSavedBadge: string;
  createdPrefix: string;

  // Priorities
  priorityLabel: string;
  priorityLow: string;
  priorityNormal: string;
  priorityHigh: string;
  prioritySuffix: string;

  // Subtasks & Detail Panel
  subtasksTitle: string;
  subtaskCountUnit: string;
  addSubtaskPlaceholder: string;
  notesPlaceholder: string;
  taskTitlePlaceholder: string;
  markComplete: string;
  markCompletedDone: string;
  pinLabel: string;
  unpinLabel: string;

  // Empty states
  emptySearchTitle: string;
  emptySearchDesc: string;
  emptyCompletedTitle: string;
  emptyCompletedDesc: string;
  emptyListTitle: string;
  emptyListDesc: string;
  addFirstTaskButton: string;

  // Settings Modal
  settingsSubtitle: string;
  tabGeneral: string;
  tabTrash: string;
  languageSectionTitle: string;
  languageSearchPlaceholder: string;
  appearanceModeTitle: string;
  lightMode: string;
  darkMode: string;
  colorThemeTitle: string;
  themesCountUnit: string;
  dataAndBackupTitle: string;
  localRecordsBadge: string;
  dragReorderTitle: string;
  dragLockedDesc: string;
  dragUnlockedDesc: string;
  lockedBadge: string;
  unlockedBadge: string;
  backupRestoreTitle: string;
  backupRestoreDesc: string;
  restoreButton: string;
  restoringButton: string;
  downloadBackupButton: string;
  overwriteAndRestore: string;
  moveCompletedToTrashTitle: string;
  moveCompletedToTrashEmptyDesc: string;
  moveButton: string;
  movingButton: string;
  keyboardShortcutsTitle: string;
  shortcutNewTask: string;
  shortcutSearch: string;
  shortcutReorder: string;
  shortcutEscape: string;

  // Trash tab
  trashIntroDesc: string;
  emptyTrashButton: string;
  confirmDeleteAllPermanent: string;
  deletingButton: string;
  trashEmptyTitle: string;
  trashEmptyDesc: string;
  tasksTitle: string;
  deletedPrefix: string;
  restoreItemButton: string;
  permanentDeleteTitle: string;
  confirmMoveCategoryTrash: string;

  // Auto & Manual Update System
  updatesSectionTitle: string;
  currentVersionLabel: string;
  checkForUpdatesButton: string;
  checkingUpdatesLabel: string;
  upToDateLabel: string;
  updateAvailableLabel: string;
  downloadAndInstallButton: string;
  downloadingUpdateLabel: string;
  updateErrorOfflineLabel: string;
  autoUpdateToggleTitle: string;
  autoUpdateToggleDesc: string;
  lastCheckedPrefix: string;
  viewReleaseNotes: string;

  // Legal & Compliance (Microsoft Store & Global)
  legalSectionTitle: string;
  legalSectionSubtitle: string;
  backToSettingsButton: string;
  legalPrivacyTitle: string;
  legalTermsTitle: string;
  legalKvkkGdprTitle: string;
  legalOpenSourceTitle: string;
  legalAccessibilityTitle: string;
  legalLastUpdated: string;

  // Offline & Toasts
  offlineBannerText: string;
  undoButton: string;
  todoMovedToTrashToast: string;
  categoryMovedToTrashToast: string;
  backupRestoredToast: string;
}

export const TR_DICTIONARY: UiDictionary = {
  allTasks: 'Tüm Görevler',
  today: 'Bugün',
  important: 'Önemli',
  completed: 'Tamamlananlar',
  categories: 'Kategoriler',
  uncategorized: 'Kategorisiz',
  noCategoriesYet: 'Henüz kategori yok.',
  newCategory: 'Yeni Kategori',
  categoryNamePlaceholder: 'Kategori adı...',
  searchPlaceholder: 'Ara...',
  clearSearch: 'Aramayı Temizle',
  settings: 'Ayarlar',
  sponsor: 'Sponsor',
  collapseSidebar: 'Minimal menü',
  expandSidebar: 'Kenar menüsünü genişlet',
  closeMenu: 'Menüyü kapat',
  openMenu: 'Menüyü aç',

  activeCountLabel: 'aktif',
  completedCountLabel: 'tamamlanan',
  filterAll: 'Tümü',
  filterActive: 'Aktif',
  filterCompleted: 'Tamamlanan',
  clearCompleted: 'Tamamlananları Temizle',
  sortCustom: 'Özel Sıra',
  sortPriority: 'Öncelik',
  sortDueDate: 'Tarih',
  sortNewest: 'En Yeni',
  retry: 'Tekrar Dene',

  addTaskPlaceholder: 'Yeni görev ekle...',
  addButton: 'Ekle',
  addingButton: 'Ekleniyor...',
  applyButton: 'Uygula',
  cancelButton: 'Vazgeç',
  deleteToTrashButton: 'Çöpe Taşı',
  dateButton: 'Tarih',
  startDateLabel: 'Başlangıç Tarihi',
  dueDateLabel: 'Bitiş / Son Tarih',
  optionalDateHint: 'İsteğe bağlı: Tek tarih, başlangıç-bitiş aralığı veya tarihsiz bırakabilirsiniz.',
  tomorrow: 'Yarın',
  yesterday: 'Dün',
  overdueSuffix: 'Gecikti',
  clearDate: 'Temizle',
  instantSaveBadge: 'Anlık kaydedilir',
  autoSavedBadge: 'Otomatik kaydedildi',
  createdPrefix: 'Oluşturuldu',

  priorityLabel: 'Öncelik',
  priorityLow: 'Düşük',
  priorityNormal: 'Normal',
  priorityHigh: 'Yüksek',
  prioritySuffix: 'öncelik',

  subtasksTitle: 'Alt Görevler',
  subtaskCountUnit: 'alt görev',
  addSubtaskPlaceholder: "Alt görev ekle ve Enter'a bas...",
  notesPlaceholder: 'Notlar veya ayrıntılar ekleyin (anlık kaydedilir)...',
  taskTitlePlaceholder: 'Görev başlığı...',
  markComplete: 'Tamamla',
  markCompletedDone: 'Tamamlandı',
  pinLabel: 'Sabitle',
  unpinLabel: 'Sabitlemeyi kaldır',

  emptySearchTitle: 'Eşleşen görev bulunamadı',
  emptySearchDesc: 'Aramanıza uygun kayıt bulunamadı.',
  emptyCompletedTitle: 'Henüz tamamlanan görev yok',
  emptyCompletedDesc: 'Tamamladığınız görevler burada listelenir.',
  emptyListTitle: 'Bu liste şu an boş',
  emptyListDesc: 'Yukarıdaki alana yazıp Enter tuşuna basarak ilk görevinizi hemen ekleyebilirsiniz.',
  addFirstTaskButton: 'İlk Görevi Ekle',

  settingsSubtitle: 'Tüm değişiklikler bilgisayarınıza anında kaydedilir.',
  tabGeneral: 'Genel ve Tema',
  tabTrash: 'Çöp Kutusu',
  languageSectionTitle: 'Uygulama Dili (73 Dil)',
  languageSearchPlaceholder: 'Dil ara (Türkçe, English, Deutsch...)...',
  appearanceModeTitle: 'Görünüm Modu',
  lightMode: 'Açık',
  darkMode: 'Koyu',
  colorThemeTitle: 'Renk Teması',
  themesCountUnit: 'tema',
  dataAndBackupTitle: 'Veri ve Yedekleme',
  localRecordsBadge: 'kayıt · Cihazda kayıtlı',
  dragReorderTitle: 'Sürükleyerek Sıralama',
  dragLockedDesc: 'Kilitli - kategori ve görevlerin konumu sürüklenerek değiştirilemez.',
  dragUnlockedDesc: 'Açık - kategori ve görevleri tutup sürükleyerek yeniden sıralayabilirsiniz.',
  lockedBadge: 'Kilitli',
  unlockedBadge: 'Açık',
  backupRestoreTitle: 'Yedek İndir / Geri Yükle',
  backupRestoreDesc: 'Tüm görev, kategori, alt görev ve çöp kutusu verilerinizi yedek dosyası olarak indirin veya geri yükleyin.',
  restoreButton: 'Geri Yükle',
  restoringButton: 'Yükleniyor...',
  downloadBackupButton: 'İndir',
  overwriteAndRestore: 'Üzerine Yaz ve Yükle',
  moveCompletedToTrashTitle: 'Tamamlananları Çöp Kutusuna Taşı',
  moveCompletedToTrashEmptyDesc: 'Taşınacak tamamlanmış görev bulunmuyor.',
  moveButton: 'Taşı',
  movingButton: 'Taşınıyor...',
  keyboardShortcutsTitle: 'Klavye Kısayolları',
  shortcutNewTask: 'Yeni görev girişine odaklan',
  shortcutSearch: 'Görevlerde ara',
  shortcutReorder: 'Seçili görevin sırasını taşı',
  shortcutEscape: 'Açık paneli veya pencereyi kapat',

  trashIntroDesc: 'Silinen görev ve kategoriler buradan geri yüklenebilir veya kalıcı olarak silinebilir.',
  emptyTrashButton: 'Çöp Kutusunu Boşalt',
  confirmDeleteAllPermanent: 'Tümünü Kalıcı Sil',
  deletingButton: 'Siliniyor...',
  trashEmptyTitle: 'Çöp kutusu boş',
  trashEmptyDesc: 'Sildiğiniz görevler ve kategoriler burada güvenle saklanır.',
  tasksTitle: 'Görevler',
  deletedPrefix: 'Silindi',
  restoreItemButton: 'Geri Yükle',
  permanentDeleteTitle: 'Kalıcı Sil',
  confirmMoveCategoryTrash: 'çöp kutusuna taşınsın mı? Görevler korunur.',

  updatesSectionTitle: 'Güncellemeler ve Sürüm Kontrolü',
  currentVersionLabel: 'Mevcut Sürüm',
  checkForUpdatesButton: 'Güncellemeleri Kontrol Et',
  checkingUpdatesLabel: 'Yeni sürüm kontrol ediliyor...',
  upToDateLabel: 'Agendamea güncel. En son sürümü kullanıyorsunuz.',
  updateAvailableLabel: 'Yeni sürüm mevcut',
  downloadAndInstallButton: 'İndir ve Güncelle',
  downloadingUpdateLabel: 'Güncelleme indiriliyor...',
  updateErrorOfflineLabel: 'Güncelleme sunucusuna şu an ulaşılamadı. İnternet bağlantınızı kontrol edin.',
  autoUpdateToggleTitle: 'Otomatik Güncelleme Kontrolü',
  autoUpdateToggleDesc: 'Uygulama açılışında yeni sürümleri arka planda otomatik denetle.',
  lastCheckedPrefix: 'Son kontrol',
  viewReleaseNotes: 'Sürüm Notları',

  legalSectionTitle: 'Yasal Belgeler ve Microsoft Store Uyumluluğu',
  legalSectionSubtitle: 'Bilgileri görüntülemek için ilgili başlığa tıklayın.',
  backToSettingsButton: 'Ayarlara Dön',
  legalPrivacyTitle: 'Gizlilik Politikası',
  legalTermsTitle: 'Kullanım Koşulları ve Lisans (EULA)',
  legalKvkkGdprTitle: 'KVKK ve GDPR Veri Koruma Aydınlatma Metni',
  legalOpenSourceTitle: 'Açık Kaynak ve Üçüncü Taraf Lisansları',
  legalAccessibilityTitle: 'Erişilebilirlik ve Destek Beyanı',
  legalLastUpdated: 'Son Güncelleme: Kasım 2026 · Yayıncı: Vellium (vellium.dev)',

  offlineBannerText: 'Çevrimdışı çalışıyor - verileriniz cihazınızda güvende',
  undoButton: 'Geri Al',
  todoMovedToTrashToast: 'Görev çöp kutusuna taşındı',
  categoryMovedToTrashToast: 'Kategori çöp kutusuna taşındı',
  backupRestoredToast: 'Yedek başarıyla geri yüklendi.',
};

export const EN_DICTIONARY: UiDictionary = {
  allTasks: 'All Tasks',
  today: 'Today',
  important: 'Important',
  completed: 'Completed',
  categories: 'Categories',
  uncategorized: 'Uncategorized',
  noCategoriesYet: 'No categories yet.',
  newCategory: 'New Category',
  categoryNamePlaceholder: 'Category name...',
  searchPlaceholder: 'Search...',
  clearSearch: 'Clear Search',
  settings: 'Settings',
  sponsor: 'Sponsor',
  collapseSidebar: 'Minimal sidebar',
  expandSidebar: 'Expand sidebar',
  closeMenu: 'Close menu',
  openMenu: 'Open menu',

  activeCountLabel: 'active',
  completedCountLabel: 'completed',
  filterAll: 'All',
  filterActive: 'Active',
  filterCompleted: 'Completed',
  clearCompleted: 'Clear Completed',
  sortCustom: 'Custom Order',
  sortPriority: 'Priority',
  sortDueDate: 'Date',
  sortNewest: 'Newest',
  retry: 'Retry',

  addTaskPlaceholder: 'Add a new task...',
  addButton: 'Add',
  addingButton: 'Adding...',
  applyButton: 'Apply',
  cancelButton: 'Cancel',
  deleteToTrashButton: 'Move to Trash',
  dateButton: 'Date',
  startDateLabel: 'Start Date',
  dueDateLabel: 'End / Due Date',
  optionalDateHint: 'Optional: Choose a single date, a start-end range, or leave undated.',
  tomorrow: 'Tomorrow',
  yesterday: 'Yesterday',
  overdueSuffix: 'Overdue',
  clearDate: 'Clear',
  instantSaveBadge: 'Saved instantly',
  autoSavedBadge: 'Saved automatically',
  createdPrefix: 'Created',

  priorityLabel: 'Priority',
  priorityLow: 'Low',
  priorityNormal: 'Normal',
  priorityHigh: 'High',
  prioritySuffix: 'priority',

  subtasksTitle: 'Subtasks',
  subtaskCountUnit: 'subtasks',
  addSubtaskPlaceholder: 'Add subtask and press Enter...',
  notesPlaceholder: 'Add notes or details (saved instantly)...',
  taskTitlePlaceholder: 'Task title...',
  markComplete: 'Complete',
  markCompletedDone: 'Completed',
  pinLabel: 'Pin',
  unpinLabel: 'Unpin',

  emptySearchTitle: 'No matching tasks found',
  emptySearchDesc: 'No items matched your search query.',
  emptyCompletedTitle: 'No completed tasks yet',
  emptyCompletedDesc: 'Tasks you complete will appear here.',
  emptyListTitle: 'This list is currently empty',
  emptyListDesc: 'Type above and press Enter to add your first task right away.',
  addFirstTaskButton: 'Add First Task',

  settingsSubtitle: 'All changes are saved instantly to your device.',
  tabGeneral: 'General & Theme',
  tabTrash: 'Trash',
  languageSectionTitle: 'Application Language (73 Languages)',
  languageSearchPlaceholder: 'Search language (English, Türkçe, Deutsch...)...',
  appearanceModeTitle: 'Appearance Mode',
  lightMode: 'Light',
  darkMode: 'Dark',
  colorThemeTitle: 'Color Theme',
  themesCountUnit: 'themes',
  dataAndBackupTitle: 'Data & Backup',
  localRecordsBadge: 'items · Stored on device',
  dragReorderTitle: 'Drag & Drop Reordering',
  dragLockedDesc: 'Locked - categories and tasks cannot be dragged to reorder.',
  dragUnlockedDesc: 'Unlocked - drag categories and tasks to reorder them freely.',
  lockedBadge: 'Locked',
  unlockedBadge: 'Unlocked',
  backupRestoreTitle: 'Download / Restore Backup',
  backupRestoreDesc: 'Download or restore all tasks, categories, subtasks, and trash as a backup file.',
  restoreButton: 'Restore',
  restoringButton: 'Restoring...',
  downloadBackupButton: 'Download',
  overwriteAndRestore: 'Overwrite & Restore',
  moveCompletedToTrashTitle: 'Move Completed to Trash',
  moveCompletedToTrashEmptyDesc: 'No completed tasks to move.',
  moveButton: 'Move',
  movingButton: 'Moving...',
  keyboardShortcutsTitle: 'Keyboard Shortcuts',
  shortcutNewTask: 'Focus new task input',
  shortcutSearch: 'Search tasks',
  shortcutReorder: 'Move selected task up or down',
  shortcutEscape: 'Close active panel or dialog',

  trashIntroDesc: 'Deleted tasks and categories can be restored or permanently removed here.',
  emptyTrashButton: 'Empty Trash',
  confirmDeleteAllPermanent: 'Delete All Permanently',
  deletingButton: 'Deleting...',
  trashEmptyTitle: 'Trash is empty',
  trashEmptyDesc: 'Tasks and categories you delete are safely kept here.',
  tasksTitle: 'Tasks',
  deletedPrefix: 'Deleted',
  restoreItemButton: 'Restore',
  permanentDeleteTitle: 'Delete Permanently',
  confirmMoveCategoryTrash: 'Move to trash? Tasks will be preserved.',

  updatesSectionTitle: 'Updates & Version Check',
  currentVersionLabel: 'Current Version',
  checkForUpdatesButton: 'Check for Updates',
  checkingUpdatesLabel: 'Checking for updates...',
  upToDateLabel: 'Agendamea is up to date. You are running the latest version.',
  updateAvailableLabel: 'New version available',
  downloadAndInstallButton: 'Download & Update',
  downloadingUpdateLabel: 'Downloading update...',
  updateErrorOfflineLabel: 'Could not reach the update server. Please check your internet connection.',
  autoUpdateToggleTitle: 'Automatic Update Check',
  autoUpdateToggleDesc: 'Automatically check for new releases in the background on startup.',
  lastCheckedPrefix: 'Last checked',
  viewReleaseNotes: 'Release Notes',

  legalSectionTitle: 'Legal Notices & Microsoft Store Compliance',
  legalSectionSubtitle: 'Click any document below to view its full content.',
  backToSettingsButton: 'Back to Settings',
  legalPrivacyTitle: 'Privacy Policy',
  legalTermsTitle: 'Terms of Use & License (EULA)',
  legalKvkkGdprTitle: 'GDPR & Data Protection Notice',
  legalOpenSourceTitle: 'Open Source & Third-Party Notices',
  legalAccessibilityTitle: 'Accessibility & Support Statement',
  legalLastUpdated: 'Last Updated: November 2026 · Publisher: Vellium (vellium.dev)',

  offlineBannerText: 'Working offline - your data is safely stored on your device',
  undoButton: 'Undo',
  todoMovedToTrashToast: 'Task moved to trash',
  categoryMovedToTrashToast: 'Category moved to trash',
  backupRestoredToast: 'Backup restored successfully.',
};

export const THEME_NAME_TRANSLATIONS: Record<string, { tr: string; en: string }> = {
  obsidian: { tr: 'Siyah', en: 'Obsidian' },
  slate: { tr: 'Gri', en: 'Slate' },
  navy: { tr: 'Lacivert', en: 'Navy' },
  blue: { tr: 'Mavi', en: 'Blue' },
  cyan: { tr: 'Turkuaz', en: 'Cyan' },
  purple: { tr: 'Mor', en: 'Purple' },
  red: { tr: 'Kırmızı', en: 'Red' },
  orange: { tr: 'Turuncu', en: 'Orange' },
  yellow: { tr: 'Kehribar', en: 'Amber' },
  emerald: { tr: 'Zümrüt', en: 'Emerald' },
  grass: { tr: 'Yeşil', en: 'Green' },
  lime: { tr: 'Limon', en: 'Lime' },
  pink: { tr: 'Pembe', en: 'Pink' },
  indigo: { tr: 'İndigo', en: 'Indigo' },
};

export type LegalDocId = 'privacy' | 'terms' | 'gdpr' | 'opensource' | 'accessibility';

export interface LegalDocSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDocumentContent {
  id: LegalDocId;
  title: string;
  subtitle: string;
  sections: LegalDocSection[];
}

export function getLegalDocuments(lang: LanguageCode, dict: UiDictionary): Record<LegalDocId, LegalDocumentContent> {
  const isTr = lang === 'tr' || lang === 'az' || lang === 'tk' || lang === 'uz' || lang === 'kk' || lang === 'ky';

  if (isTr) {
    return {
      privacy: {
        id: 'privacy',
        title: dict.legalPrivacyTitle,
        subtitle: dict.legalLastUpdated,
        sections: [
          {
            heading: '1. Yerel Öncelikli (Offline-First) Veri Mimarisi',
            paragraphs: [
              'Agendamea, Vellium (vellium.dev) tarafından gizlilik öncelikli olarak geliştirilmiştir. Oluşturduğunuz tüm görevler, başlangıç ve bitiş tarihleri, alt görevler, notlar, kategoriler ve tema tercihleri yalnızca kendi bilgisayarınızda (%APPDATA%\\Agendamea dizininde) yerel olarak saklanır.',
              'Hiçbir görev veriniz uzak bir bulut sunucusuna gönderilmez, üçüncü taraflarla paylaşılmaz veya reklam/profilleme amacıyla işlenmez.',
            ],
          },
          {
            heading: '2. Telemetri, İzleme ve Analitik Yokluğu',
            paragraphs: [
              'Agendamea içinde hiçbir kullanıcı izleme kodu, analitik izleyicisi, reklam kimliği veya davranışsal telemetri bulunmaz. Uygulama internet bağlantısı olmadan tam kapasiteyle çalışır.',
            ],
          },
          {
            heading: '3. Güncelleme Kontrolü ve Dış Bağlantılar',
            paragraphs: [
              'Otomatik güncelleme kontrolü açık olduğunda veya manuel olarak "Güncellemeleri Kontrol Et" düğmesine bastığınızda, uygulama yalnızca en son sürüm numarasını doğrulamak amacıyla GitHub Releases (api.github.com/repos/emirtdede/Agendamea/releases/latest) adresine standart bir HTTPS sorgusu gönderir. Bu sorguda kişisel veri gönderilmez. Otomatik kontrolü Ayarlar içinden dilediğiniz zaman kapatabilirsiniz.',
            ],
          },
          {
            heading: '4. Veri Taşınabilirliği ve Kalıcı Silme Kontrolü',
            paragraphs: [
              'Verilerinizi dilediğiniz an Ayarlar > Veri ve Yedekleme bölümünden yedek dosyası olarak bilgisayarınıza indirebilir veya geri yükleyebilirsiniz. Uygulamayı Windows Denetim Masası veya Ayarlar üzerinden kaldırırken "Kullanıcı verilerini de sil" seçeneğini işaretleyerek tüm yerel kayıtlarınızı kalıcı olarak temizleyebilirsiniz.',
            ],
          },
        ],
      },
      terms: {
        id: 'terms',
        title: dict.legalTermsTitle,
        subtitle: dict.legalLastUpdated,
        sections: [
          {
            heading: '1. Lisans Kapsamı ve Kullanım Hakkı',
            paragraphs: [
              'Agendamea, Vellium tarafından MIT Açık Kaynak Lisansı ve Microsoft Store Standart Uygulama Lisans Koşulları çerçevesinde sunulmaktadır. Uygulamayı kişisel ve ticari görev yönetimi amacıyla cihazlarınızda ücretsiz olarak kurabilir ve kullanabilirsiniz.',
            ],
          },
          {
            heading: '2. Kullanıcı Sorumluluğu ve Yedekleme',
            paragraphs: [
              'Veriler tamamen kullanıcının kendi cihazında yerel olarak tutulduğundan, cihaz arızası veya işletim sistemi sıfırlaması gibi durumlara karşı Ayarlar > Yedek İndir özelliğiyle düzenli yedek almak kullanıcının sorumluluğundadır.',
            ],
          },
          {
            heading: '3. Garanti Reddi ve Sorumluluk Sınırı',
            paragraphs: [
              'Yazılım, yürürlükteki yasaların izin verdiği azami ölçüde, açık veya zımni herhangi bir garanti olmaksızın "olduğu gibi" (AS-IS) sunulmaktadır. Vellium, yazılımın kullanımından veya kullanılamamasından doğabilecek dolaylı ya da doğrudan veri kayıplarından sorumlu tutulamaz.',
            ],
          },
          {
            heading: '4. Fikri Mülkiyet',
            paragraphs: [
              'Agendamea adı, amblemi ve Vellium markası Vellium (vellium.dev) bünyesine aittir.',
            ],
          },
        ],
      },
      gdpr: {
        id: 'gdpr',
        title: dict.legalKvkkGdprTitle,
        subtitle: dict.legalLastUpdated,
        sections: [
          {
            heading: '1. Veri Sorumlusu ve İşleme Amacı',
            paragraphs: [
              '6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) kapsamında Vellium, kullanıcı cihazında tutulan görev verilerine uzaktan erişmez ve merkezi bir veri tabanında kişisel veri toplamaz.',
            ],
          },
          {
            heading: '2. Yerel Depolama ve Güvenlik',
            paragraphs: [
              'Tüm uygulama ayarları (dil tercihi, renk teması, sıralama kilidi) ve görev kayıtları yalnızca cihazınızın işletim sistemi kullanıcı profili altında saklanır. Yerel ağ dışından erişime kapalıdır (yalnızca 127.0.0.1 geri döngü arayüzü).',
            ],
          },
          {
            heading: '3. İlgili Kişi Hakları (Erişim, Düzeltme, Silme ve Taşıma)',
            paragraphs: [
              'Tüm veriler cihazınızda olduğundan; verilerinize anında erişme, düzenleme, Çöp Kutusu üzerinden kalıcı olarak silme ve dışa aktarma (veri taşınabilirliği) haklarınızı doğrudan uygulama arayüzünden herhangi bir başvuruya gerek kalmaksızın kullanabilirsiniz.',
            ],
          },
        ],
      },
      opensource: {
        id: 'opensource',
        title: dict.legalOpenSourceTitle,
        subtitle: dict.legalLastUpdated,
        sections: [
          {
            heading: '1. Agendamea Lisansı (MIT)',
            paragraphs: [
              'Copyright © 2026 Vellium (https://vellium.dev). Bu yazılım MIT Lisansı altında lisanslanmıştır.',
            ],
          },
          {
            heading: '2. Üçüncü Taraf Açık Kaynak Bileşenleri',
            paragraphs: [
              'Agendamea aşağıdaki açık kaynaklı kütüphaneleri kendi lisans koşullarına uygun olarak kullanır:',
              '• Electron (MIT License) - Masaüstü uygulama çalışma zamanı',
              '• React & React DOM (MIT License) - Kullanıcı arayüzü kütüphanesi',
              '• Better-SQLite3 & SQLite (MIT / Public Domain) - Yerel veri motoru',
              '• Express (MIT License) - Yerel geri döngü sunucu katmanı',
              '• Tailwind CSS (MIT License) - Stil ve tasarım sistemi',
              '• Lucide React (ISC License) - Vektörel simge seti',
              '• Vite & Vite Plugin PWA (MIT License) - Derleme ve çevrimdışı çalışma altyapısı',
            ],
          },
        ],
      },
      accessibility: {
        id: 'accessibility',
        title: dict.legalAccessibilityTitle,
        subtitle: dict.legalLastUpdated,
        sections: [
          {
            heading: '1. Klavye ve Ekran Okuyucu Erişilebilirliği',
            paragraphs: [
              'Agendamea, WCAG 2.1 AA kontrast hedefleri ve tam klavye navigasyonu gözetilerek tasarlanmıştır. N (yeni görev), / veya Ctrl+K (arama), Alt+Yukarı/Aşağı (görev sırası taşıma) ve Esc (panel/pencere kapatma) kısayolları ile fareye ihtiyaç duyulmadan kullanılabilir.',
            ],
          },
          {
            heading: '2. Çoklu Dil ve Sağdan Sola (RTL) Yazım Desteği',
            paragraphs: [
              'Uygulama 73 dili ve Arapça, Farsça, İbranice, Urduca gibi sağdan sola (RTL) yazılan diller için otomatik yönlendirmeyi destekler.',
            ],
          },
          {
            heading: '3. Microsoft Store Sertifikasyon ve Destek İletişimi',
            paragraphs: [
              'Agendamea, Windows 10/11 güvenlik, temiz kurulum/kaldırma ve yerel veri izolasyonu standartlarına tam uyumludur.',
              'Web Sitesi: https://vellium.dev · E-posta Destek: support@vellium.dev · GitHub: https://github.com/emirtdede/Agendamea',
            ],
          },
        ],
      },
    };
  }

  return {
    privacy: {
      id: 'privacy',
      title: dict.legalPrivacyTitle,
      subtitle: dict.legalLastUpdated,
      sections: [
        {
          heading: '1. Local-First (Offline-First) Data Architecture',
          paragraphs: [
            'Agendamea is built by Vellium (vellium.dev) with a strict local-first privacy architecture. All tasks, optional start and due dates, subtasks, notes, categories, and theme settings you create are stored exclusively on your own device (%APPDATA%\\Agendamea).',
            'None of your task data is ever transmitted to external cloud servers, sold to third parties, or used for advertising or profiling.',
          ],
        },
        {
          heading: '2. Zero Telemetry, Tracking, or Analytics',
          paragraphs: [
            'Agendamea contains no analytics trackers, advertising identifiers, or behavioral telemetry. The application operates with full capability completely offline.',
          ],
        },
        {
          heading: '3. Update Checks & External Requests',
          paragraphs: [
            'When Automatic Update Check is enabled or when you manually click "Check for Updates", Agendamea makes a standard read-only HTTPS request to GitHub Releases (api.github.com/repos/emirtdede/Agendamea/releases/latest) solely to check if a newer version is available. No personal data is transmitted. You can disable automatic update checks at any time in Settings.',
          ],
        },
        {
          heading: '4. Data Portability & Complete Deletion Control',
          paragraphs: [
            'You can export or restore all your data at any time via Settings > Data & Backup. When uninstalling Agendamea on Windows, you can select the "Also delete user data" option to permanently remove all local data files from your computer.',
          ],
        },
      ],
    },
    terms: {
      id: 'terms',
      title: dict.legalTermsTitle,
      subtitle: dict.legalLastUpdated,
      sections: [
        {
          heading: '1. License Grant & Permitted Use',
          paragraphs: [
            'Agendamea is provided by Vellium under the MIT License and the Microsoft Store Standard Application License Terms. You are granted a non-exclusive, worldwide, royalty-free license to install and use the application for personal or commercial task management.',
          ],
        },
        {
          heading: '2. User Data & Backup Responsibility',
          paragraphs: [
            'Because all records reside locally on your device without cloud synchronization, you are responsible for maintaining periodic backups of your data using the built-in Download Backup feature in Settings.',
          ],
        },
        {
          heading: '3. Disclaimer of Warranties & Limitation of Liability',
          paragraphs: [
            'To the maximum extent permitted by applicable law, the software is provided "AS IS" without warranty of any kind. Vellium shall not be liable for any direct, indirect, or incidental damages or data loss arising from the use of the software.',
          ],
        },
        {
          heading: '4. Intellectual Property',
          paragraphs: [
            'The Agendamea name, emblem, and Vellium brand identity are property of Vellium (vellium.dev).',
          ],
        },
      ],
    },
    gdpr: {
      id: 'gdpr',
      title: dict.legalKvkkGdprTitle,
      subtitle: dict.legalLastUpdated,
      sections: [
        {
          heading: '1. Data Controller & Local Processing',
          paragraphs: [
            'Under the EU General Data Protection Regulation (GDPR), UK GDPR, and Turkish KVKK (Law No. 6698), Vellium does not collect, host, or remotely process personal user data on central servers.',
          ],
        },
        {
          heading: '2. Local Storage & Loopback Security',
          paragraphs: [
            'All application preferences (language, theme, drag lock) and task records are stored strictly within your operating system user profile and served only over the local loopback interface (127.0.0.1) with strict origin and CSRF protections.',
          ],
        },
        {
          heading: '3. Exercise of Data Subject Rights',
          paragraphs: [
            'Because all data is stored directly on your device, you have immediate, self-service control over your right of access, rectification, permanent erasure (via Empty Trash or Uninstaller data wipe), and data portability (via Backup Download) directly within the application.',
          ],
        },
      ],
    },
    opensource: {
      id: 'opensource',
      title: dict.legalOpenSourceTitle,
      subtitle: dict.legalLastUpdated,
      sections: [
        {
          heading: '1. Agendamea License (MIT)',
          paragraphs: [
            'Copyright © 2026 Vellium (https://vellium.dev). Released under the MIT License.',
          ],
        },
        {
          heading: '2. Third-Party Open Source Attributions',
          paragraphs: [
            'Agendamea incorporates the following open source software components in accordance with their respective licenses:',
            '• Electron (MIT License) - Desktop application runtime',
            '• React & React DOM (MIT License) - User interface library',
            '• Better-SQLite3 & SQLite (MIT / Public Domain) - Local storage engine',
            '• Express (MIT License) - Local loopback application server',
            '• Tailwind CSS (MIT License) - Design and styling framework',
            '• Lucide React (ISC License) - Vector icon library',
            '• Vite & Vite Plugin PWA (MIT License) - Bundler and offline worker runtime',
          ],
        },
      ],
    },
    accessibility: {
      id: 'accessibility',
      title: dict.legalAccessibilityTitle,
      subtitle: dict.legalLastUpdated,
      sections: [
        {
          heading: '1. Keyboard Navigation & Screen Reader Support',
          paragraphs: [
            'Agendamea is engineered for WCAG 2.1 AA contrast compliance, semantic ARIA landmarks, and complete keyboard operation: N (focus new task), / or Ctrl+K (search), Alt+Up/Down (reorder selected task), and Esc (close panel or dialog).',
          ],
        },
        {
          heading: '2. 73-Language & Right-to-Left (RTL) Support',
          paragraphs: [
            'The interface supports 73 world languages with automatic document direction switching for right-to-left (RTL) scripts including Arabic, Persian, Hebrew, and Urdu.',
          ],
        },
        {
          heading: '3. Microsoft Store Compliance & Publisher Support',
          paragraphs: [
            'Agendamea complies with Windows 10/11 desktop integration, clean install/uninstall lifecycle, and local data isolation requirements.',
            'Website: https://vellium.dev · Support Email: support@vellium.dev · GitHub: https://github.com/emirtdede/Agendamea',
          ],
        },
      ],
    },
  };
}
