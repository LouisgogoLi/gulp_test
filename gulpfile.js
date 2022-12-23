// 同步任務 及 非同步任務
const { series, parallel } = require('gulp');
// 來源, 目的地
const { src, dest } = require('gulp');
// 編譯 ES6 工具
const babel = require('gulp-babel');
// 壓縮工具
const uglify = require('gulp-uglify');
// 清除資料夾內檔案的套件
const clean = require('gulp-clean');
// 檔案合併工具
const concat = require('gulp-concat');
// 檔案重新命名工具
const rename = require('gulp-rename');
// 載入 Sass 套件
const sass = require('gulp-sass')(require('sass'));
// 載入 gulp-postcss 套件
const postcss = require('gulp-postcss');
// 載入 autoprefixer 套件
const autoprefixer = require('autoprefixer');
// 瀏覽器同步顯示套件
const browserSync = require('browser-sync').create();
// 檔案監聽套件
const watch = require('gulp-watch');

// Dist 檔案清除任務
function cleanTask() {
  return src('./dist/', { read: false, allowEmpty: true }) // 允許內容為空
    .pipe(clean());
}

// 複製任務(沒有需要編譯的東西可以直接透過此任務複製, 不複製的檔案來源最前方可加上驚嘆號就會避開複製, 複製任務不需要安裝額外套件, 比如圖片可以透過此任務直接複製過來)
function copyFileTask() {
  return src(['./src/**/*', '!src/**/js', '!src/**/js/**/*', '!src/assets/style/**/*.scss']).pipe(dest('./dist/'));
}

// JS 編譯任務
function jsTask() {
  return src('./src/assets/js/*.js')
    .pipe(
      babel({
        presets: ['@babel/env'], // 使用預設環境編譯
      })
    )
    .pipe(src('./src/assets/vendor/*.js'))
    .pipe(
      babel({
        presets: ['@babel/env'], // 使用預設環境編譯
      })
    )
    .pipe(concat('all.js')) // 整合檔案為 all.js
    .pipe(uglify()) // 壓縮檔案
    .pipe(
      rename(function (path) {
        path.basename += '.min';
        path.extname = '.js';
      })
    ) // 更改檔案名稱
    .pipe(dest('./dist/js'));
}

// Sass 編譯任務
function sassTask() {
  return src('./src/assets/style/**/*.scss') // SCSS 檔案路徑
    .pipe(sass().on('error', sass.logError)) // 編譯, 如果有錯必須把 Error 輸出
    .pipe(postcss([autoprefixer()])) // 將編譯完成的 CSS 做 PostCSS 處理
    .pipe(dest('./dist/css')); // 輸出
}

// 熱更新dist底下文件
function reload() {
  return src('./dist/**/*').pipe(browserSync.stream());
}

// 瀏覽器同步任務
function browserTask() {
  browserSync.init({
    server: {
      baseDir: './dist', // 模擬指向丟上伺服器要指定的資料夾
      reloadDebounce: 3000, // 每次重新整理必須間格 3 秒
    },
    port: 8085,
  });
}

// 檔案監聽套件
function watchTask() {
  watch('./src/**/*.html', series(cleanTask, copyFileTask, jsTask, sassTask, reload));
  watch('./src/assets/js/**/*.js', series(cleanTask, copyFileTask, jsTask, sassTask, reload));
  watch('./src/assets/style/**/*.scss', series(cleanTask, copyFileTask, jsTask, sassTask, reload));
}

exports.clean = cleanTask;
exports.copy = copyFileTask;
exports.js = jsTask;
exports.sass = sassTask;
exports.sync = browserTask;
exports.watch = watchTask;

exports.default = series(cleanTask, copyFileTask, jsTask, sassTask, parallel(browserTask, watchTask));
