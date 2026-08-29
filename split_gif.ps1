Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('C:\Users\user\googleantigravity\player\spr_player_walk\spr_playerT_walk.gif')
$fd = new-object System.Drawing.Imaging.FrameDimension($img.FrameDimensionsList[0])
$count = $img.GetFrameCount($fd)
for ($i = 0; $i -lt $count; $i++) {
    $img.SelectActiveFrame($fd, $i)
    $filename = 'C:\Users\user\googleantigravity\player\spr_player_walk\spr_playerT_walk' + ($i + 1) + '.png'
    $img.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
}
Write-Output "Extracted $count frames!"
