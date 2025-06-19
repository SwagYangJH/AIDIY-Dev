# AIDIY 部署指南

## 🚀 部署架构

- **前端**: Vercel (静态托管)
- **后端**: Railway (Python Flask)
- **数据库**: MongoDB Atlas
- **域名**: aidiy.ca (Squarespace)

## 📋 部署步骤

### 1. MongoDB Atlas 设置
1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建免费账户
3. 创建新集群 (选择免费层 M0)
4. 创建数据库用户
5. 获取连接字符串

### 2. Railway 后端部署
1. 访问 [Railway.app](https://railway.app)
2. 使用GitHub登录
3. 选择 "Deploy from GitHub repo"
4. 选择此仓库
5. 设置环境变量:
   - `MONGO_URI`: MongoDB连接字符串
   - `FLASK_SECRET_KEY`: Flask密钥
   - `JWT_SECRET`: JWT密钥
   - `OPENAI_API_KEY`: 你的OpenAI API Key
   - `DEV_MODE`: False
   - `MAIL_USERNAME`: 邮件用户名
   - `MAIL_PASSWORD`: 邮件密码

### 3. Vercel 前端部署
1. 访问 [Vercel.com](https://vercel.com)
2. 使用GitHub登录
3. 导入此仓库
4. 设置构建设置:
   - Framework Preset: Create React App
   - Root Directory: client
5. 设置环境变量:
   - `REACT_APP_API_URL`: Railway后端URL

### 4. 域名配置
1. 在Railway获取后端URL
2. 在Vercel获取前端URL
3. 在Squarespace DNS设置中:
   - 添加CNAME记录: www -> vercel前端URL
   - 添加A记录: @ -> vercel前端IP

## 🔧 环境变量

### 后端 (Railway)
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aidiy_app
FLASK_SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
OPENAI_API_KEY=sk-your-openai-key
DEV_MODE=False
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 前端 (Vercel)
```
REACT_APP_API_URL=https://your-app.railway.app
```

## 🌐 访问地址

- **生产网站**: https://aidiy.ca
- **后端API**: https://your-app.railway.app
- **管理后台**: Vercel/Railway仪表板 