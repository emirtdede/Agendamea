; Agendamea — Vellium Windows 11 Özel Kurulum ve Kaldırma Betiği (UTF-8 BOM)

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
  !define MUI_FINISHPAGE_LINK "vellium.dev — Destek: support@vellium.dev"

  !ifdef MUI_FINISHPAGE_LINK_LOCATION
    !undef MUI_FINISHPAGE_LINK_LOCATION
  !endif
  !define MUI_FINISHPAGE_LINK_LOCATION "https://vellium.dev"

  ; Kaldırma (Uninstall) Karşılama & Onay Ekranları
  !ifdef MUI_UNCONFIRMPAGE_TEXT_TOP
    !undef MUI_UNCONFIRMPAGE_TEXT_TOP
  !endif
  !define MUI_UNCONFIRMPAGE_TEXT_TOP "Agendamea (Vellium) bilgisayarınızdan kaldırılacaktır. Kaldırma işlemi sırasında kayıtlı görev ve ayarlarınızı koruyup korumak istemediğiniz ayrıca sorulacaktır."

  !ifdef MUI_UNFINISHPAGE_TITLE
    !undef MUI_UNFINISHPAGE_TITLE
  !endif
  !define MUI_UNFINISHPAGE_TITLE "Agendamea Kaldırıldı"

  !ifdef MUI_UNFINISHPAGE_TEXT
    !undef MUI_UNFINISHPAGE_TEXT
  !endif
  !define MUI_UNFINISHPAGE_TEXT "Agendamea bilgisayarınızdan başarıyla kaldırıldı.$\r$\n$\r$\nDestek veya geri bildirim için: support@vellium.dev"
!macroend

!macro customInstall
  ; Windows 11 Ayarlar > Yüklü Uygulamalar yayıncı, sürüm ve destek bilgileri
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "Publisher" "Vellium"
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "URLInfoAbout" "https://vellium.dev"
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "HelpLink" "https://vellium.dev"
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "Contact" "support@vellium.dev"
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "Comments" "Günlük görevlerinizi zahmetsizce planlamanız için sade, hızlı ve çevrimdışı çalışan masaüstü görev yöneticisi."
  WriteRegDWORD SHCTX "${UNINSTALL_REGISTRY_KEY}" "NoModify" 1
  WriteRegDWORD SHCTX "${UNINSTALL_REGISTRY_KEY}" "NoRepair" 1
!macroend

!macro customUnInstall
  ; Sessiz kaldırmada (/S) kullanıcı verilerini koru; etkileşimli kaldırmada kullanıcıya sor
  IfSilent skip_userdata_prompt
  IfFileExists "$APPDATA\Agendamea\*.*" 0 skip_userdata_prompt
    MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 \
      "Bilgisayarınızda kayıtlı Agendamea görevlerinizi ve tema ayarlarınızı da kalıcı olarak silmek istiyor musunuz?$\r$\n$\r$\n'Hayır' seçerseniz verileriniz gelecekteki kurulumlar için korunur." \
      IDNO skip_userdata_prompt
    RMDir /r "$APPDATA\Agendamea"
  skip_userdata_prompt:
!macroend
