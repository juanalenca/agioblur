$localesDir = "C:\Users\SAD\Documents\projeto-agioblur\_locales"
$languages = @{
    "pt_BR" = @{ btnFactoryReset = "Esqueci meu PIN (Redefinir Extensão)"; btnConfirmReset = "Tem certeza? Clique novamente" };
    "en" = @{ btnFactoryReset = "Forgot my PIN (Factory Reset)"; btnConfirmReset = "Are you sure? Click again" };
    "es" = @{ btnFactoryReset = "Olvidé mi PIN (Restablecer Extensión)"; btnConfirmReset = "¿Estás seguro? Haz clic de nuevo" };
    "hi" = @{ btnFactoryReset = "मैं अपना पिन भूल गया (एक्सटेंशन रीसेट करें)"; btnConfirmReset = "क्या आप वाकई ऐसा करना चाहते हैं? फिर से क्लिक करें" };
    "id" = @{ btnFactoryReset = "Lupa PIN saya (Setel Ulang Ekstensi)"; btnConfirmReset = "Apakah Anda yakin? Klik lagi" };
    "de" = @{ btnFactoryReset = "PIN vergessen (Erweiterung zurücksetzen)"; btnConfirmReset = "Sind Sie sicher? Klicken Sie erneut" };
    "ar" = @{ btnFactoryReset = "نسيت رقم التعريف الشخصي (إعادة ضبط الإضافة)"; btnConfirmReset = "هل أنت متأكد؟ انقر مرة أخرى" };
    "fr" = @{ btnFactoryReset = "J'ai oublié mon code PIN (Réinitialiser l'extension)"; btnConfirmReset = "Êtes-vous sûr ? Cliquez à nouveau" };
    "it" = @{ btnFactoryReset = "Ho dimenticato il PIN (Ripristina estensione)"; btnConfirmReset = "Sei sicuro? Clicca di nuovo" };
    "tr" = @{ btnFactoryReset = "PIN'imi unuttum (Eklentiyi Sıfırla)"; btnConfirmReset = "Emin misiniz? Tekrar tıklayın" }
}

foreach ($lang in $languages.Keys) {
    $filePath = Join-Path $localesDir $lang "messages.json"
    if (Test-Path $filePath) {
        $jsonStr = Get-Content -Raw -Encoding UTF8 $filePath
        $newKeys = "`r`n  ,`"btnFactoryReset`": { `"message`": `"$($languages[$lang].btnFactoryReset)`" },`r`n  `"btnConfirmReset`": { `"message`": `"$($languages[$lang].btnConfirmReset)`" }`r`n}"
        $jsonStr = $jsonStr -replace '\s*\}\s*$', $newKeys
        Set-Content -Path $filePath -Value $jsonStr -Encoding UTF8
    }
}
Write-Output "Translations updated successfully."
