// ==========================================================================
//  HONK! — lançador do Windows (HONK.exe)
//
//  É o programa que o atalho da Área de Trabalho e do Menu Iniciar abre.
//  Não tem janela de console: procura o Microsoft Edge (vem em todo Windows
//  10/11) ou o Google Chrome/Brave e abre o jogo numa JANELA PRÓPRIA, em modo
//  aplicativo, direto dos arquivos instalados (sem servidor, sem cmd).
//
//  O perfil do navegador fica em %LOCALAPPDATA%\HONK\perfil: é ali que o
//  progresso (moedas, recorde, lojas) é salvo, e ele sobrevive a atualizações.
//
//  Compilar (já vem no Windows, .NET Framework 4):
//    %WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /target:winexe
//      /win32icon:..\icone\honk.ico /r:System.Windows.Forms.dll /out:HONK.exe Lancador.cs
//  (escrito em C# 5 de propósito: é o que esse compilador embutido entende)
// ==========================================================================
using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: System.Reflection.AssemblyTitle("HONK!")]
[assembly: System.Reflection.AssemblyProduct("HONK! - um ganso acordou com ódio")]
[assembly: System.Reflection.AssemblyCopyright("Victor H. Correa - GPL-3.0")]

static class Lancador
{
    // opções que deixam o jogo mais fluido e a janela "limpa" (sem extensões nem barra)
    const string Opcoes = "--allow-file-access-from-files --no-first-run --no-default-browser-check " +
        "--disable-extensions --start-maximized --ignore-gpu-blocklist --enable-gpu-rasterization " +
        "--enable-zero-copy --disable-background-timer-throttling --disable-renderer-backgrounding " +
        "--disable-backgrounding-occluded-windows --autoplay-policy=no-user-gesture-required";

    [STAThread]
    static int Main()
    {
        string pasta = AppDomain.CurrentDomain.BaseDirectory;
        string jogo = Path.Combine(Path.Combine(pasta, "jogo"), "index.html");
        if (!File.Exists(jogo))
        {
            Aviso("Não encontrei os arquivos do jogo em:\n" + jogo + "\n\nReinstale o HONK!.");
            return 2;
        }

        string navegador = Achar("msedge.exe", @"Microsoft\Edge\Application\msedge.exe")
                        ?? Achar("chrome.exe", @"Google\Chrome\Application\chrome.exe")
                        ?? Achar("brave.exe", @"BraveSoftware\Brave-Browser\Application\brave.exe");
        if (navegador == null)
        {
            Aviso("O HONK! abre dentro do Microsoft Edge ou do Google Chrome, e não encontrei nenhum dos dois.\n\n" +
                  "Instale um deles e abra o jogo de novo.");
            return 1;
        }

        string perfil = Path.Combine(Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "HONK"), "perfil");
        Directory.CreateDirectory(perfil);

        string url = new Uri(jogo).AbsoluteUri;           // file:///C:/Program%20Files/HONK/jogo/index.html
        string argumentos = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" {2}", url, perfil, Opcoes);
        try
        {
            Process.Start(new ProcessStartInfo(navegador, argumentos) { UseShellExecute = false, WorkingDirectory = pasta });
        }
        catch (Exception erro)
        {
            Aviso("Não consegui abrir o navegador:\n" + erro.Message);
            return 3;
        }
        return 0;
    }

    // Procura um navegador: primeiro no registro (App Paths), depois nas pastas de instalação comuns.
    static string Achar(string exe, string relativo)
    {
        foreach (RegistryKey raiz in new[] { Registry.CurrentUser, Registry.LocalMachine })
        {
            using (RegistryKey chave = raiz.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\" + exe))
            {
                if (chave == null) continue;
                string valor = chave.GetValue("") as string;
                if (!string.IsNullOrEmpty(valor))
                {
                    valor = valor.Trim('"');
                    if (File.Exists(valor)) return valor;
                }
            }
        }
        string[] bases = {
            Environment.GetEnvironmentVariable("ProgramFiles(x86)"),
            Environment.GetEnvironmentVariable("ProgramFiles"),
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData)
        };
        foreach (string b in bases)
        {
            if (string.IsNullOrEmpty(b)) continue;
            string caminho = Path.Combine(b, relativo);
            if (File.Exists(caminho)) return caminho;
        }
        return null;
    }

    static void Aviso(string texto)
    {
        MessageBox.Show(texto, "HONK!", MessageBoxButtons.OK, MessageBoxIcon.Warning);
    }
}
