; Agendamea - Vellium Windows 11 Özel Kurulum ve Kaldırma Betiği (UTF-8 BOM)

!include "nsDialogs.nsh"
!include "LogicLib.nsh"

!ifdef BUILD_UNINSTALLER
  Var /GLOBAL UnDataDialog
  Var /GLOBAL UnDataInfoLabel
  Var /GLOBAL UnDataCheckbox
  Var /GLOBAL UnDataHintLabel
  Var /GLOBAL DeleteUserDataFlag
!endif

!macro customHeader
  ; Modern UI 2 Header sağ yerleşim ve temiz görünüm
  !ifndef MUI_HEADERIMAGE_RIGHT
    !define MUI_HEADERIMAGE_RIGHT
  !endif

  ; Kurulum Karşılama Ekranı
  !ifdef MUI_WELCOMEPAGE_TITLE
    !undef MUI_WELCOMEPAGE_TITLE
  !endif
  !define MUI_WELCOMEPAGE_TITLE "Agendamea Kurulumuna Hoş Geldiniz"

  !ifdef MUI_WELCOMEPAGE_TEXT
    !undef MUI_WELCOMEPAGE_TEXT
  !endif
  !define MUI_WELCOMEPAGE_TEXT "Agendamea, günlük görevlerinizi sakin ve düzenli bir şekilde yönetmeniz için Vellium tarafından tasarlandı.$\r$\n$\r$\nİnternet bağlantısı gerekmeden çalışır; tüm görevleriniz ve ayarlarınız güvenle bilgisayarınızda saklanır.$\r$\n$\r$\nDevam etmek için İleri'ye tıklayın."

  ; Kurulum Tamamlandı Ekranı
  !ifdef MUI_FINISHPAGE_TITLE
    !undef MUI_FINISHPAGE_TITLE
  !endif
  !define MUI_FINISHPAGE_TITLE "Agendamea Kurulumu Tamamlandı"

  !ifdef MUI_FINISHPAGE_TEXT
    !undef MUI_FINISHPAGE_TEXT
  !endif
  !define MUI_FINISHPAGE_TEXT "Agendamea bilgisayarınıza başarıyla kuruldu.$\r$\n$\r$\nSihirbazı kapatmak ve uygulamayı kullanmaya başlamak için Bitir'e tıklayın."

  !ifdef MUI_FINISHPAGE_RUN_TEXT
    !undef MUI_FINISHPAGE_RUN_TEXT
  !endif
  !define MUI_FINISHPAGE_RUN_TEXT "Agendamea uygulamasını şimdi başlat"

  !ifdef MUI_FINISHPAGE_LINK
    !undef MUI_FINISHPAGE_LINK
  !endif
  !define MUI_FINISHPAGE_LINK "vellium.dev - Destek: support@vellium.dev"

  !ifdef MUI_FINISHPAGE_LINK_LOCATION
    !undef MUI_FINISHPAGE_LINK_LOCATION
  !endif
  !define MUI_FINISHPAGE_LINK_LOCATION "https://vellium.dev"

  ; Kaldırma (Uninstall) Karşılama & Tamamlandı Ekranları
  !ifdef MUI_UNCONFIRMPAGE_TEXT_TOP
    !undef MUI_UNCONFIRMPAGE_TEXT_TOP
  !endif
  !define MUI_UNCONFIRMPAGE_TEXT_TOP "Agendamea (Vellium) bilgisayarınızdan kaldırılacaktır."

  !ifdef MUI_UNFINISHPAGE_TITLE
    !undef MUI_UNFINISHPAGE_TITLE
  !endif
  !define MUI_UNFINISHPAGE_TITLE "Agendamea Kaldırıldı"

  !ifdef MUI_UNFINISHPAGE_TEXT
    !undef MUI_UNFINISHPAGE_TEXT
  !endif
  !define MUI_UNFINISHPAGE_TEXT "Agendamea bilgisayarınızdan başarıyla kaldırıldı.$\r$\n$\r$\nDestek veya geri bildirim için: support@vellium.dev"
!macroend

!ifdef BUILD_UNINSTALLER
  !macro customUnWelcomePage
    !insertmacro MUI_UNPAGE_WELCOME
    UninstPage custom un.UserDataPageCreate un.UserDataPageLeave

    Function un.UserDataPageCreate
      !insertmacro MUI_HEADER_TEXT "Kaldırma Seçenekleri" "Kayıtlı görev ve tema verilerinizin nasıl işleneceğini seçin."

      nsDialogs::Create 1018
      Pop $UnDataDialog
      ${If} $UnDataDialog == error
        Abort
      ${EndIf}

      ${NSD_CreateLabel} 0 8u 100% 30u "Agendamea uygulama dosyaları bilgisayarınızdan kaldırılacaktır. Aşağıdaki seçeneği işaretleyerek yerel veritabanınızı ve tema ayarlarınızı da kalıcı olarak silebilirsiniz."
      Pop $UnDataInfoLabel

      ${NSD_CreateCheckbox} 0 48u 100% 16u "Kullanıcı verilerini de sil (tüm görevler, kategoriler ve ayarlar)"
      Pop $UnDataCheckbox
      ${If} $DeleteUserDataFlag == ${BST_CHECKED}
        ${NSD_Check} $UnDataCheckbox
      ${EndIf}

      ${NSD_CreateLabel} 14u 68u 92% 34u "İşaretlenmezse verileriniz (%APPDATA%\Agendamea) korunur ve uygulamayı yeniden kurduğunuzda kaldığınız yerden devam edebilirsiniz."
      Pop $UnDataHintLabel

      nsDialogs::Show
    FunctionEnd

    Function un.UserDataPageLeave
      ${NSD_GetState} $UnDataCheckbox $DeleteUserDataFlag
    FunctionEnd
  !macroend
!endif

!macro customInstall
  ; Windows 11 Ayarlar > Yüklü Uygulamalar ve Denetim Masası yayıncı, ikon ve destek bilgileri
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "DisplayIcon" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "Publisher" "Vellium"
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "URLInfoAbout" "https://vellium.dev"
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "HelpLink" "https://vellium.dev"
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "Contact" "support@vellium.dev"
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "Comments" "Günlük görevlerinizi zahmetsizce planlamanız için sade, hızlı ve çevrimdışı çalışan masaüstü görev yöneticisi."
  WriteRegDWORD SHCTX "${UNINSTALL_REGISTRY_KEY}" "NoModify" 1
  WriteRegDWORD SHCTX "${UNINSTALL_REGISTRY_KEY}" "NoRepair" 1
  ; Windows Explorer ve Denetim Masası simge önbelleğini anında yenile
  System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
!macroend

!macro customUnInstall
  ; Kullanıcı "Kullanıcı verilerini de sil" seçeneğini işaretlediyse yerel AppData verilerini temizle
  ${If} $DeleteUserDataFlag == ${BST_CHECKED}
    ; Per-machine kurulumda bile daima kullanıcının gerçek AppData dizinini hedefle
    ${If} $installMode == "all"
      SetShellVarContext current
    ${EndIf}

    RMDir /r "$APPDATA\Agendamea"
    RMDir /r "$APPDATA\agendamea"
    RMDir /r "$LOCALAPPDATA\Agendamea"
    RMDir /r "$LOCALAPPDATA\agendamea-updater"

    ${If} $installMode == "all"
      SetShellVarContext all
    ${EndIf}
  ${EndIf}
!macroend
