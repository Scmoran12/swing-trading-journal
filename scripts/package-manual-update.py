"""Create a source-only Windows handoff; never package local secrets/data/history."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import hashlib,json
root=Path(__file__).resolve().parents[1]
files=[root/p for p in ['package.json','package-lock.json','tsconfig.json','next-env.d.ts','next.config.ts','.env.example','docs/WINDOWS_TODO.md','docs/PHASE2_DELIVERY.md']]
for folder in ['src','local/migrations','scripts/database','scripts/local','scripts/testing','scripts/windows','tests/foundation','tests/security','tests/trading','tests/database','tests/http']:
 files.extend(p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
legacy=[]
old=root/'reports/swingpilot-foundation-update.zip'
if old.exists():
 with ZipFile(old)as archive:
  first=archive.read('swingpilot-foundation-update/local/migrations/0001_foundation.sql')
  assert first==(root/'local/migrations/0001_foundation.sql').read_bytes(),'Never rewrite a delivered migration'
  for path in ['src/app/dashboard/page.tsx','src/app/settings/page.tsx','src/app/[section]/page.tsx']:
   legacy.append({'path':path,'knownOriginalSha256':hashlib.sha256(archive.read('swingpilot-foundation-update/'+path)).hexdigest(),'action':'Remove only when unchanged; otherwise review/move local changes to protected replacement.'})
else:
 raise RuntimeError('Known predecessor archive required for safe legacy manifest')
manifest={'version':'0.2.0','scope':'Cumulative manual application update; Windows acceptance pending; backups deferred',
 'preserve':['.git/**','.codex/**','scripts/phase0/**','tests/phase0/**','AGENTS.md','docs/TASKS.md','docs/VALIDATION_STATUS.md','docs/reviews/PHASE0_FEASIBILITY.md','real configuration/data','.env files except the non-secret .env.example template'],
 'incomingFiles':[{'path':str(p.relative_to(root)).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}for p in sorted(set(files))],
 'legacyPagesToReview':legacy,'instructions':'Extract separately, review collisions in the existing local Codex project; follow docs/WINDOWS_TODO.md. Never blanket overwrite newer Windows bridge/status files.'}
readme='SwingPilot AI manual core v0.2\n\nStart with docs/WINDOWS_TODO.md and docs/PHASE2_DELIVERY.md.\nThis is cumulative application source; older application updates are not required.\nExtract separately and merge into the existing Windows project. Preserve native bridge, Phase 0 tests, agents and evidence.\nUPDATE_MANIFEST.json lists hashes and legacy unprotected page paths requiring review/removal.\nNo credentials, real data, installed packages, build outputs or Git history included.\n'
output=root/'reports/swingpilot-manual-journal-update.zip'
with ZipFile(output,'w',ZIP_DEFLATED)as archive:
 for p in sorted(set(files)):archive.write(p,Path('swingpilot-manual-journal-update')/p.relative_to(root))
 archive.writestr('swingpilot-manual-journal-update/UPDATE_MANIFEST.json',json.dumps(manifest,indent=2))
 archive.writestr('swingpilot-manual-journal-update/README_UPDATE.md',readme)
with ZipFile(output)as archive:
 assert archive.testzip()is None
 for name in archive.namelist():
  assert not any(x in name for x in ['/.git/','/.codex/','/scripts/phase0/','/tests/phase0/','/node_modules/','/.next/','/.env.local','/settings.json','/AGENTS.md','/TASKS.md','/VALIDATION_STATUS.md'])
 for entry in manifest['incomingFiles']:
  assert hashlib.sha256(archive.read('swingpilot-manual-journal-update/'+entry['path'])).hexdigest()==entry['sha256']
print(f'Verified cumulative Windows bundle: {len(set(files))} source files + manifest/readme, {output.stat().st_size} bytes. Initial migration unchanged; 3 legacy pages identified; native bridge/status/secrets/data excluded.')
