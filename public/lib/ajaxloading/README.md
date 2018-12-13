# ajaxloading

> 基于jquery的加载中样式

## 使用

首先，引入css文件夹下的loading.css和index.js；然后在domready下，调用ajaxloading函数即可：

    $(function(){
        //有三种情况：不传参数或参数为'ajax'为未使用eos3的情况（移动端可以用这种），'eos3'为使用eos3的情况，'zues'为像楼栋管理吃豆
        //注意：如果使用eos3，请先引入eos3
        //第二个参数为忽略加载中的服务名称数组
        ajaxloading('eos3', 
            [
                'getAddressList'
            ]
        );
    });
    
## 后续考虑添加的功能

1. 考虑是否添加服务调时延迟些时间，如果服务秒回就不会出现闪一下的情况。
    