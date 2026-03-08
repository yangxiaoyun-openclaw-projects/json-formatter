# 部署到阿里云服务器

## 前置准备

### 1. 在阿里云服务器上执行

```bash
# 创建目录
sudo mkdir -p /var/www/json-formatter
sudo chown $USER:$USER /var/www/json-formatter

# 克隆仓库
cd /var/www
git clone https://github.com/yangxiaoluck/json-formatter.git json-formatter
cd json-formatter

# 安装依赖
pip3 install -r requirements.txt

# 安装 systemd 服务
sudo cp deploy/json-formatter.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable json-formatter
sudo systemctl start json-formatter
```

### 2. 在 GitHub 仓库设置 Secrets

进入仓库 Settings → Secrets and variables → Actions，添加：

- `ALIYUN_HOST`: 阿里云服务器 IP 地址
- `ALIYUN_USERNAME`: SSH 用户名（如 root）
- `ALIYUN_SSH_KEY`: SSH 私钥内容

### 3. 修改 Flask 启动配置（生产环境）

app.py 需要修改为监听 0.0.0.0：

```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## 自动部署

每次 push 到 master 分支会自动触发部署。

## 手动部署

在 GitHub Actions 页面点击 "Deploy to Aliyun" 工作流，选择 "Run workflow"。

## 访问

部署完成后访问：http://阿里云IP:5000
