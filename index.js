const express = require('express')
const app = express()
const port = 80;
const spawn = require('child_process').spawnSync;

var makeFolders = spawn('mkdir',['images','movies','public']);

//take an image when the webserver is accessed
app.get('/', (req, res) => {
    console.log("request")
    const unixTime = parseInt( new Date().getTime() / 1000 );
    var snap = spawn('/usr/bin/python3', [`${__dirname}/python/snap.py`,`${__dirname}/public/${unixTime}.jpg`]);
    var colorOutput = spawn('/usr/bin/convert', [`${__dirname}/public/${unixTime}.jpg`,'-resize','1x1','txt:-']);
    const rgbArray = colorOutput.stdout.toString().split("srgb")[2].slice(1,-2).split(",");
    console.log(rgbArray);
    let totalBrightness = 0;
    for( let color of rgbArray ){
        totalBrightness += parseInt(color);
    }
    console.log(totalBrightness);
    if(totalBrightness<10){//too dim, remove
        var remove = spawn('rm', [`${__dirname}/public/${unixTime}.jpg`]);
        console.log(`DARK IMAGE: removing ${unixTime}.jpg measured ${totalBrightness} brightness`)
        res.sendFile(`${__dirname}/public/eee.png`);
    }else{
        res.sendFile(`${__dirname}/public/${unixTime}.jpg`);
    }
});

app.listen(port, () => console.log(`Listening on port ${port}`));

const takePicture = () => {
    const unixTime = parseInt( new Date().getTime() / 1000 );
    var snap = spawn('/usr/bin/python3', [`${__dirname}/python/snap.py`,`${__dirname}/images/${unixTime}.jpg`]);
    
    var colorOutput = spawn('/usr/bin/convert', [`${__dirname}/images/${unixTime}.jpg`,'-resize','1x1','txt:-']);
    try{
        const rgbArray = colorOutput.stdout.toString().split("srgb")[2].slice(1,-2).split(",");
        let totalBrightness = 0;
        for( let color of rgbArray ){
            totalBrightness += parseInt(color);
        }
        if(totalBrightness<10){//too dim, remove
            var remove = spawn('rm', [`${__dirname}/images/${unixTime}.jpg`]);
            console.log(`DARK IMAGE: removing ${unixTime}.jpg measured ${totalBrightness} brightness`);
        }else{
            var copy = spawn('scp', [`${__dirname}/images/${unixTime}.jpg`, 'backup@server:~/timelapse/images']);
            console.log(`SAVED: ${unixTime}.jpg measured ${totalBrightness} brightness`)
        }
    }catch(e){
        console.log(`something went wrong`);
        console.log(e);
    }
}

const time = setInterval(takePicture, 10000);

// nohup ffmpeg -r 60 -pattern_type glob -i '*.jpg' -r 60 -vcodec libx264 -pix_fmt yuv420p -preset slow -profile:v high -level:v 5.1 -threads 4 -crf 22 -s 1920x1080 -an -y ../movies/date_60fps.mp4 > ../ffmpeg.log &
// nohup ffmpeg -r 120 -pattern_type glob -i '*.jpg' -r 120 -vcodec libx264 -pix_fmt yuv420p -preset slow -profile:v high -level:v 5.1 -threads 4 -crf 22 -s 1920x1080 -an -y ../movies/date_120fps.mp4 > ../ffmpeg.log &
