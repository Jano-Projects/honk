#!/usr/bin/env perl
# =====================================================================
#  HONK! — servidor HTTP mínimo (plano B do macOS e modo portátil)
#  Usa só módulos que JÁ VÊM com o Perl (presente em todo Linux e macOS),
#  então não precisa instalar nada.
#
#  Uso:  perl servidor.pl [porta] [comando-para-abrir-o-navegador]
#        (no comando, %URL% é trocado pelo endereço do jogo)
#  Só aceita conexões do próprio computador (127.0.0.1).
# =====================================================================
use strict;
use warnings;
use IO::Socket::INET;
use File::Basename qw(dirname);
use Cwd qw(abs_path);

my $porta  = shift // 8642;
my $abrir  = shift // '';
my $raiz   = dirname(abs_path($0));
$| = 1;   # mostra as mensagens na hora

my %tipo = (
  html => 'text/html; charset=utf-8', js => 'text/javascript', mjs => 'text/javascript',
  wasm => 'application/wasm', png => 'image/png', css => 'text/css', woff2 => 'font/woff2',
  json => 'application/json', md => 'text/plain; charset=utf-8',
);

# tenta a porta pedida e as 20 seguintes (caso alguma esteja ocupada)
my $srv;
for my $p ($porta .. $porta + 20) {
  $srv = IO::Socket::INET->new(LocalAddr => '127.0.0.1', LocalPort => $p, Listen => 16, ReuseAddr => 1, Proto => 'tcp');
  if ($srv) { $porta = $p; last }
}
die "Não consegui abrir nenhuma porta entre $porta e " . ($porta + 20) . ".\n" unless $srv;

my $url = "http://localhost:$porta/";
print "\n  HONK! 3D rodando em $url\n  (deixe esta janela aberta enquanto joga; feche ou aperte Ctrl+C para sair)\n\n";
# abre o navegador: se o comando tiver %URL%, troca pelo endereço; senão, põe no fim
if ($abrir) {
  my $cmd = $abrir =~ /%URL%/ ? ($abrir =~ s/%URL%/$url/gr) : "$abrir '$url'";
  system("$cmd >/dev/null 2>&1 &");
}

while (my $c = $srv->accept) {
  binmode $c;
  my $linha = <$c>;
  unless (defined $linha) { close $c; next }
  while (my $h = <$c>) { last if $h =~ /^\r?\n$/ }        # ignora os cabeçalhos

  my ($metodo, $caminho) = $linha =~ m{^(GET|HEAD) (\S+)};
  $caminho //= '/';
  $caminho =~ s/[?#].*//;
  $caminho =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/ge;
  $caminho = '/index.html' if $caminho eq '/';

  if (!$metodo || $caminho =~ /\.\./ || $caminho !~ m{^/}) {
    print $c "HTTP/1.0 400 Bad Request\r\nContent-Length: 0\r\n\r\n"; close $c; next;
  }
  my $arq = $raiz . $caminho;
  if (-f $arq && open(my $f, '<:raw', $arq)) {
    local $/; my $dados = <$f>; close $f;
    my ($ext) = $arq =~ /\.(\w+)$/;
    my $ct = $tipo{lc($ext // '')} // 'application/octet-stream';
    print $c "HTTP/1.0 200 OK\r\nContent-Type: $ct\r\nContent-Length: " . length($dados) . "\r\nConnection: close\r\n\r\n";
    print $c $dados if $metodo eq 'GET';
  } else {
    print $c "HTTP/1.0 404 Not Found\r\nContent-Length: 0\r\n\r\n";
  }
  close $c;
}
