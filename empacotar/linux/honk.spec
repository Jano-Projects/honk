# HONK! — receita do pacote .rpm (Fedora, openSUSE, RHEL...). Use montar-rpm.sh.
Name:           honk
Version:        %{versao}
Release:        1%{?dist}
Summary:        Um ganso acordou com odio - roguelite feito em SQL
License:        GPL-3.0-or-later
URL:            https://github.com/Jano-Projects/honk
BuildArch:      noarch
Requires:       python3
Recommends:     chromium

%description
Roguelite em xilogravura de cordel cujo motor e um banco de dados:
todas as regras do jogo sao SQL rodando no DuckDB, dentro do navegador.
Ciclos sem fim por cinco lugares, cartas de poder, combos e chefes.

%install
sh %{raiz}/empacotar/linux/preparar-arvore.sh %{buildroot}

%files
/usr/bin/honk
/usr/share/honk
/usr/share/applications/honk.desktop
/usr/share/icons/hicolor/*/apps/honk.*
%doc /usr/share/doc/honk
