<!doctype html>
<html lang="id">
<body style="margin:0;padding:24px 12px;background:#f4f3ee;font-family:'Segoe UI',Arial,sans-serif;color:#1b1a17;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e8e4d9;border-radius:14px;">
        <tr><td style="padding:22px 26px 6px;">
          <span style="display:inline-block;width:30px;height:30px;line-height:30px;text-align:center;border-radius:8px;background:#f97316;color:#fff;font-weight:800;font-size:16px;">K</span>
          <span style="font-size:17px;font-weight:700;vertical-align:middle;margin-left:8px;">Kanbify</span>
        </td></tr>
        <tr><td style="padding:10px 26px 4px;">
          <h1 style="margin:0;font-size:20px;line-height:1.3;">Halo {{ $recipient->fullname ?: $recipient->username }},</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#6b675d;">
            Ada {{ $total }} aktivitas baru di board kamu.
          </p>
        </td></tr>

        @foreach ($byBoard as $boardName => $items)
          <tr><td style="padding:18px 26px 0;">
            <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#f97316;">{{ $boardName }}</div>
          </td></tr>
          @foreach ($items as $n)
            @php
              $name = $n->actor->fullname ?: $n->actor->username;
              $ini  = strtoupper(mb_substr($name, 0, 1));
            @endphp
            <tr><td style="padding:10px 26px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="38" valign="top">
                    {{-- Foto profil disimpan sebagai data URI; klien email memblokirnya, jadi pakai inisial. --}}
                    <span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:#fde6d3;color:#b45309;font-weight:700;font-size:13px;">{{ $ini }}</span>
                  </td>
                  <td valign="top" style="font-size:14px;line-height:1.5;">
                    <strong>{{ $name }}</strong> {{ \App\Services\NotificationService::describe($n) }}
                    <div style="font-size:12px;color:#9a968a;">{{ $n->created_at->timezone('Asia/Jakarta')->format('d M, H:i') }} WIB</div>
                  </td>
                </tr>
              </table>
            </td></tr>
          @endforeach
        @endforeach

        <tr><td style="padding:26px;">
          <a href="{{ $appUrl }}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px;">Buka Kanbify</a>
        </td></tr>
      </table>
      <p style="font-size:12px;color:#9a968a;margin:14px 0 0;">Email ini dikirim karena kamu anggota board di Kanbify.</p>
    </td></tr>
  </table>
</body>
</html>
