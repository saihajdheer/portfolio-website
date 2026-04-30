$filePath = "c:\Users\Saihaj Dheer\Desktop\sem 6\portfolio\website\saihaj_portfolio_v8.html"
$lines = [System.IO.File]::ReadAllLines($filePath)
$startIndex = -1
$endIndex = -1

for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '<!-- ABOUT') {
        $startIndex = $i
    }
    if ($startIndex -ne -1 -and $lines[$i] -match '<!-- MODAL -->') {
        $endIndex = $i
        break
    }
}

if ($startIndex -ne -1 -and $endIndex -ne -1) {
    $before = $lines[0..($startIndex-1)]
    $after = $lines[$endIndex..($lines.Length-1)]
    
    $newContent = @"
<!-- ABOUT — id="about" -->
<style>
  .animated-sticker {
    display: inline-block;
    background: #f8f8f8;
    padding: 4px 10px;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    vertical-align: middle;
    font-size: 24px;
    animation: float-sticker 3.5s ease-in-out infinite;
    border: 1px solid #eaeaea;
    margin: 0 4px;
    line-height: 1;
  }
  .sticker-1 { animation-delay: 0s; }
  .sticker-2 { animation-delay: 1s; padding: 4px 8px; }
  .sticker-3 { animation-delay: 2s; background: transparent; box-shadow: none; border: none; font-size: 32px; margin-top: -10px; }
  @keyframes float-sticker {
    0%, 100% { transform: translateY(0) rotate(-2deg); }
    50% { transform: translateY(-8px) rotate(4deg); }
  }
  .about-me-headline {
    font-family: 'Inter', sans-serif;
    font-size: clamp(28px, 3vw, 42px);
    font-weight: 500;
    line-height: 1.5;
    color: #111;
    letter-spacing: -0.5px;
  }
  .photo-card {
    background: #fff !important;
    padding: 15px 15px 20px 15px !important;
    border-radius: 16px !important;
    box-shadow: 0 16px 40px rgba(0,0,0,0.06) !important;
    transform: rotate(-3deg) !important;
    transition: transform 0.4s ease !important;
    border: 1px solid #f0f0f0 !important;
  }
  .photo-card:hover {
    transform: rotate(0deg) scale(1.02) !important;
  }
  .photo-card .pc-img {
    width: 100% !important;
    aspect-ratio: 0.8 !important;
    object-fit: cover !important;
    object-position: center 20% !important;
    border-radius: 12px !important;
    filter: none !important;
  }
  .photo-card-text {
    display: none !important;
  }
  .photo-card-footer {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-top: 15px !important;
    padding: 0 5px !important;
  }
  .pc-handle {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pc-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
  }
  .pc-handle-txt h4 {
    font-size: 13px;
    font-weight: 700;
    color: #111;
    margin: 0 0 2px 0;
  }
  .pc-handle-txt p {
    font-size: 11px;
    color: #888;
    margin: 0;
  }
  .pc-connect {
    background: #111 !important;
    color: #fff !important;
    padding: 8px 16px !important;
    border-radius: 20px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    text-decoration: none !important;
    transition: background 0.2s, transform 0.2s !important;
  }
  .pc-connect:hover {
    background: #333 !important;
    transform: translateY(-2px) !important;
  }
  .resume-btn {
    background: #ec4899; 
    color: white;
    padding: 14px 28px;
    border-radius: 30px;
    font-weight: 500;
    font-size: 16px;
    transition: transform 0.2s;
    box-shadow: 0 10px 20px rgba(236, 72, 153, 0.2);
  }
  .resume-btn:hover {
    transform: translateY(-2px);
  }
  .about-btn {
    background: #222;
    color: white;
    padding: 14px 28px;
    border-radius: 30px;
    font-weight: 500;
    font-size: 16px;
    transition: transform 0.2s;
  }
  .about-btn:hover {
    transform: translateY(-2px);
  }
</style>

<div id="about">
  <div class="about-inner">
    <div class="photo-card">
      <img class="pc-img" src="assets/saihaj about me image.jpeg" alt="Saihaj Dheer">
      <div class="photo-card-text" style="display:none;"></div>
      <div class="photo-card-footer">
        <div class="pc-handle">
          <img class="pc-avatar" src="assets/saihaj about me image.jpeg" alt="Avatar">
          <div class="pc-handle-txt">
            <h4>@saihaj-dheer</h4>
            <p>Linkedin</p>
          </div>
        </div>
        <a href="https://www.linkedin.com/in/saihaj-dheer-192338297/" target="_blank" class="pc-connect">+ Connect</a>
      </div>
    </div>
    
    <div class="about-text">
      <p class="about-me-headline">
        I am Saihaj, UX/UI Design <span class="animated-sticker sticker-1">💻</span> student passionate about creating visual identities <span class="animated-sticker sticker-2">🎨</span> and digital experiences <span class="animated-sticker sticker-3">✨</span>
      </p>
      
      <div style="margin-top: 30px; display: flex; gap: 15px; flex-wrap: wrap;">
        <a href="assets/CV_202604040911586316_12301117.pdf" target="_blank" class="resume-btn" style="text-decoration:none;">Resume</a>
        <a href="#projects" class="about-btn" style="text-decoration:none;">About Me</a>
      </div>
    </div>
  </div>
</div>
"@

    $finalLines = $before + $newContent + $after
    [System.IO.File]::WriteAllText($filePath, ($finalLines -join "`r`n"), [System.Text.Encoding]::UTF8)
    Write-Host "Updated About Section Successfully! Replaced from $startIndex to $endIndex"
} else {
    Write-Host "Could not find start or end tags! Start: $startIndex, End: $endIndex"
}
