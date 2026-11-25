; ==========================================================================
;  HONK! — instalador do Windows (Inno Setup 6)
;
;  Gera:  saida\HONK-<versão>-instalador-windows.exe
;  O assistente clássico (Avançar > Avançar > Concluir), em português:
;    - instala em "Arquivos de Programas" (ou só para o usuário, sem pedir admin)
;    - cria atalhos na Área de Trabalho e no Menu Iniciar, com o ícone do ganso
;    - registra o desinstalador em "Aplicativos instalados"
;  O atalho abre o HONK.exe (Lancador.cs): sem console, numa janela própria.
;  O motor DuckDB vai junto: o jogo roda 100% offline.
;
;  Montar (o GitHub Actions faz isso sozinho ao criar uma tag v*):
;    1. python ferramentas\montar.py        (com vendor\ baixado)
;    2. compile Lancador.cs para build\windows\HONK.exe (veja o cabeçalho do .cs)
;    3. iscc /DVersao=1.0.0 empacotar\windows\honk.iss
; ==========================================================================

#ifndef Versao
  #define Versao "1.0.0"
#endif
#define Raiz "..\.."

[Setup]
AppId={{6E1C7A2B-3F4D-4B8A-9C5E-0D2F1A9B7C31}
AppName=HONK!
AppVersion={#Versao}
AppVerName=HONK! {#Versao}
AppPublisher=Victor H. Correa
AppPublisherURL=https://github.com/Jano-Projects/honk
AppSupportURL=https://github.com/Jano-Projects/honk/issues
AppComments=Um ganso acordou com ódio. Roguelite cujo motor é SQL (DuckDB).
DefaultDirName={autopf}\HONK
DefaultGroupName=HONK!
DisableProgramGroupPage=yes
; instala só para o usuário por padrão (sem pedir senha de administrador); o assistente oferece "para todos"
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
LicenseFile={#Raiz}\LICENSE
OutputDir={#Raiz}\saida
OutputBaseFilename=HONK-{#Versao}-instalador-windows
SetupIconFile={#Raiz}\empacotar\icone\honk.ico
UninstallDisplayIcon={app}\HONK.exe
UninstallDisplayName=HONK!
WizardStyle=modern
Compression=lzma2/ultra64
SolidCompression=yes

[Languages]
Name: "pt"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
Name: "en"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "atalho"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#Raiz}\build\windows\HONK.exe";         DestDir: "{app}";             Flags: ignoreversion
Source: "{#Raiz}\empacotar\icone\honk.ico";       DestDir: "{app}";             Flags: ignoreversion
Source: "{#Raiz}\dist\index.html";                DestDir: "{app}\jogo";        Flags: ignoreversion
Source: "{#Raiz}\dist\vendor\*";                  DestDir: "{app}\jogo\vendor"; Flags: ignoreversion
Source: "{#Raiz}\LICENSE";                        DestDir: "{app}";             DestName: "LICENCA.txt"

[Icons]
Name: "{group}\HONK!";               Filename: "{app}\HONK.exe"; IconFilename: "{app}\honk.ico"; Comment: "Um ganso acordou com ódio"
Name: "{group}\Desinstalar o HONK!"; Filename: "{uninstallexe}"
Name: "{autodesktop}\HONK!";         Filename: "{app}\HONK.exe"; IconFilename: "{app}\honk.ico"; Comment: "Um ganso acordou com ódio"; Tasks: atalho

[Run]
Filename: "{app}\HONK.exe"; Description: "{cm:LaunchProgram,HONK!}"; Flags: nowait postinstall skipifsilent

; O progresso salvo (%LOCALAPPDATA%\HONK\perfil) NÃO é apagado ao desinstalar,
; para não perder moedas e recordes numa reinstalação.
