var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();
var db = require('../db');
var gm = require('gm');
var svnUltimate = require('node-svn-ultimate');

/* GET home page. */
router.get('/:random', function (req, res, next) {
    const { random } = req.params;
    let { folderPath } = req.query;
    folderPath = folderPath || '';

    // 如果没有带参数，则请求根目录
    db.getProjectByRandom(random).then(function(result){
        if(!result){
            res.json({
                status: false,
                message: '不存在此项目！'
            });
        }
        let projectPath = path.resolve(__dirname, '../project/' + result.enName + '/' + folderPath);
        // 读取本地目录，过滤出图片
        var images = [];
        fs.readdir(projectPath, function(err, files){
            if(err) throw err;
            files.map(item => {
                var filePath = path.resolve(projectPath, item);
                // 跳过.开头的文件
                if(item.indexOf('.') !== 0){
                    if(fs.statSync(filePath).isDirectory()){
                        images.push({
                            type: 'folder',
                            name: item,
                            path: '/projects/' + result.enName + '/' + folderPath + '/' + item
                        });
                    }else if(/\.(png|gif|jpg|jpeg)$/i.test(path.extname(item))){
                        images.push({
                            type: 'image',
                            name: item,
                            path: '/projects/' + result.enName + '/' + folderPath + '/' + item
                        });
                    }
                }
            });

            res.render('project', {
                info: result || {},
                files: images.sort(function(a, b){  // 目录排前面
                    if((a.type === 'folder' && b.type === 'folder') || (
                            a.type === 'image' && b.type === 'image'
                        )){
                        return 0;
                    }else if(b.type === 'image'){
                        return -1;
                    }else{
                        return 1;
                    }
                })
            })
        });
    });
});

module.exports = router;
