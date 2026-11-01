"""Assinatura fixa e versão crescente no app/build.gradle gerado pelo Capacitor.

Uso: python3 patch-gradle.py android/app/build.gradle <versionCode> <versionName>
- Assina o debug com android-template/debug.keystore (mesma chave em todo build: instala por cima).
- versionCode = número do build (o Android exige versão crescente para atualizar).
"""
import re
import sys

path, code, name = sys.argv[1], sys.argv[2], sys.argv[3]
g = open(path, encoding='utf-8').read()

g = re.sub(r'versionCode\s+\d+', f'versionCode {int(code)}', g)
g = re.sub(r'versionName\s+"[^"]*"', f'versionName "{name}"', g)

signing = '''
    signingConfigs {
        fixo {
            storeFile file("../../android-template/debug.keystore")
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
        }
    }
'''
if 'signingConfigs' not in g:
    g = g.replace('    buildTypes {', signing + '    buildTypes {', 1)

# Debug e release usam a chave fixa de teste (a de produção virá depois, para a Play Store)
if 'signingConfig signingConfigs.fixo' not in g:
    g = re.sub(r'(buildTypes\s*\{)', r'\1\n        debug {\n            signingConfig signingConfigs.fixo\n        }', g, count=1)

open(path, 'w', encoding='utf-8').write(g)
print(f'build.gradle: versionCode {code}, versionName {name}, assinatura fixa')
