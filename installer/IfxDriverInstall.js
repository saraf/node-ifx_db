var fs = require('fs');
//var url = require('url');
var os = require('os');
var platform = os.platform();
var arch = os.arch();

var path = require('path');
var { spawn } = require('child_process');

//var installerURL = 'http://public.dhe.ibm.com/ibmdl/export/pub/software/data/db2/drivers/odbc_cli/';
var CURRENT_DIR = process.cwd();

function IfxNodeJsInstall()
{
    // Check prebuilt binaries available, if so install it with that
    var PreBuiltFound = UnZipPreBuilts();
    if (PreBuiltFound == true )
    {
        return(true);
    }

    //Pre-built binaries are not available for this platform. 
    if (PreBuiltFound == false )
    {
        console.log('No prebuilt binaries available for platform=' + 
                                platform + ' with architecture='+ arch);
        console.log('You may try local build steps to build the driver on this platform');
        console.log('For building the driver from its source you may run ');
        console.log('node installer/IfxDriverBuild.js');
        console.log("Trying to build it for you...");
        const buildProc = spawn('node', ['installer/IfxDriverBuild.js']);
         
       buildProc.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        buildProc.stderr.on('data', (data) => {
          console.log(`stderr: ${data}`);
        });

        buildProc.on('close', (code) => {
          console.log(`build process exited with code ${code}`);
        }); 

        //process.exit(1);
    }

    function UnZipPreBuilts()
    {
        var PlatformDir = undefined;

        if (platform == 'win32')
        {
            if (arch == 'x64')
            {
                PlatformDir = 'Win64';
            }
        }
        if (platform == 'linux' )
        {
            if (arch == 'x64')
            {
                PlatformDir = 'Linux64';
            }

            // if (arch == 'arm64')
            // {
            //     PlatformDir = 'Arm64';
            // }           
        }        

        if( PlatformDir == undefined)
        {
            return (false);
        }

        var fstream = require('fstream');
        var unzip = require('unzip');

        // var BUILD_FILE = path.resolve(CURRENT_DIR, 'bin/' + build_file);
        var BUILD_FILE = path.resolve(CURRENT_DIR, 
            'prebuilt/' + PlatformDir + '/' + 'build.zip');
        
        var readStream = fs.createReadStream(BUILD_FILE);
        var writeStream = fstream.Writer(CURRENT_DIR);

        readStream.pipe( unzip.Parse() )
            .pipe( writeStream )
            .on( "unpipe", function() { RemoveBuildArchive(); } );

        return (true);
    }

    function RemoveBuildArchive()
    {
        // Set to false if we decided to remomve pre-built
        var DoNotRemoveBuildArchive = true;
        if( DoNotRemoveBuildArchive == true)
        {
            // Let us not remove build archive
            return;
        }

        var PathBinDir = path.resolve(CURRENT_DIR, 'prebuilt');
        fs.exists(PathBinDir, function (exists)
        {
            if (exists)
            {
                RmDir(PathBinDir);
            }
        });
    }

    function RmDir(dir)
    {
        var list = fs.readdirSync(dir);

        for (var i = 0; i < list.length; i++)
        {
            var filename = path.join(dir, list[i]);
            var stat = fs.statSync(filename);

            if (filename == "." || filename == "..")
            {
                // pass these files
            }
            else if (stat.isDirectory())
            {
                // RmDir recursively
                RmDir(filename);
            }
            else
            {
                // rm fiilename
                fs.unlinkSync(filename);
            }
        }
        fs.rmdirSync(dir);
    };

};

IfxNodeJsInstall();
