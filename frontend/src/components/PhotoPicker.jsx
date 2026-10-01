import { useEffect, useRef, useState } from 'react';

// Mobile: "Take photo" opens the camera. Desktop: normal file dialog. Validates type/size client-side (server re-validates).
export default function PhotoPicker({ file, onChange, onError }) {
  const cam = useRef(null); const up = useRef(null); const [url, setUrl] = useState('');
  useEffect(() => { if (!file) return setUrl(''); const u = URL.createObjectURL(file); setUrl(u); return () => URL.revokeObjectURL(u); }, [file]);
  const pick = (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return onError?.('Please choose a JPG, PNG or WEBP image.');
    if (f.size > 5 * 1024 * 1024) return onError?.('Image is too large (max 5MB).');
    onError?.(''); onChange(f);
  };
  return (
    <div className="rounded-2xl border-2 border-dashed border-leaf/50 bg-leaf/5 p-4">
      {url ? <div className="flex items-center gap-4"><img src={url} alt="Selected" className="h-24 w-24 rounded-xl object-cover" />
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{file.name}</p><button type="button" className="text-sm text-bin-haz underline" onClick={() => onChange(null)}>Remove</button></div></div>
        : <p className="mb-3 text-sm text-mute">JPG, PNG or WEBP up to 5MB</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => cam.current.click()}>📷 Take photo</button>
        <button type="button" className="btn btn-ghost" onClick={() => up.current.click()}>🖼 Upload image</button></div>
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
      <input ref={up} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
    </div>
  );
}
