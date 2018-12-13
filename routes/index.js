var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();
var db = require('../db');
var gm = require('gm');
var svnUltimate = require('node-svn-ultimate');

function generateTumbli(fPath){
    var p = [];

    fs.readdir(fPath, function(err, files){
        if(err) throw err;

        files.map(item => {
            var filePath = path.resolve(fPath, item);
            if(fs.statSync(filePath).isDirectory()){
                p.push(generateTumbli(filePath));
            }else if(/\.(png|gif|jpg|jpeg)$/i.test(path.extname(item))){
                p.push(new Promise(resolve => {
                    gm(filePath)
                        .resize(100, 90)
                        .noProfile()
                        .write(path.resolve(fPath, item.replace('.', '.min.')), function(){
                            resolve();
                        });
                }));
            }
        });
    });

    return Promise.all(p);
}

/* GET home page. */
router.get('/', function (req, res, next) {
    db.getAllProjects().then(function(data){
        var has = false;
        for(var i = 0; i < data.length; i++){
            if(data[i].isPublic === 'true' || (req.session.user && data[i].userName === req.session.user.userName)){
                has = true;
                break;
            }
        }
        res.render('index', {
            data: data,
            has: has
        });
    });
});

router.post('/addSvn', function(req, res, next){
    const { userName, svnUserName, svn, svnPassword, zhName, enName, isPublic, isEdit, id } = req.body;
    if(isEdit === 'true'){
        // svn checkout成功
        db.addProject(isEdit, userName, zhName, enName, svn, svnUserName, svnPassword, isPublic, id).then(function(result){
            res.json(result);
        })
    }else{
        svnUltimate.commands.checkout(
            svn,
            path.resolve(__dirname, '../project/' + enName),
            {
                username: svnUserName,
                password: svnPassword
            },
            function( err ) {
                if(err){
                    res.json({
                        status: false,
                        message: '可能由2个问题造成：1. 您没有这个svn项目的权限！ 2. svn用户名或密码输入错误！'
                    })
                }else{
                    // svn checkout成功
                    // TODO 添加缩略图
                    // generateTumbli(path.resolve(__dirname, '../project')).then(function(){
                        db.addProject(isEdit, userName, zhName, enName, svn, svnUserName, svnPassword, isPublic, id).then(function(result){
                            res.json(result);
                        })
                    // })
                }
            } );
    }
});

router.post('/removeProject', function(req, res, next){
    const { id, enName } = req.body;

    db.removeProject(id, enName).then(function(result){
        if(result.value){
            res.json({
                status: true
            });
        }else{
            res.json({
                status: false
            });
        }
    });
});

module.exports = router;
