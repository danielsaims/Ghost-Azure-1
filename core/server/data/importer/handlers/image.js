const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const config = require('../../../config');
const urlUtils = require('../../../lib/url-utils');
const storage = require('../../../adapters/storage');
let ImageHandler;

ImageHandler = {
    type: 'images',
    extensions: config.get('uploads').images.extensions,
    contentTypes: config.get('uploads').images.contentTypes,
    directories: ['images', 'content'],

    loadFile: function (files, baseDir) {
        const store = storage.getStorage();
        const baseDirRegex = baseDir ? new RegExp('^' + baseDir + '/') : new RegExp('');

        const imageFolderRegexes = _.map(urlUtils.STATIC_IMAGE_URL_PREFIX.split('/'), function (dir) {
            return new RegExp('^' + dir + '/');
        });

        // normalize the directory structure
        files = _.map(files, function (file) {
            const noBaseDir = file.name.replace(baseDirRegex, '');
            let noGhostDirs = noBaseDir;

            _.each(imageFolderRegexes, function (regex) {
                noGhostDirs = noGhostDirs.replace(regex, '');
            });

            file.originalPath = noBaseDir;
            file.name = noGhostDirs;
            file.targetDir = path.join(config.getContentPath('images'), path.dirname(noGhostDirs));
            return file;
        });

        return Promise.map(files, function (image) {
            return store.getUniqueFileName(image, image.targetDir).then(function (targetFilename) {
                image.newPath = urlUtils.urlJoin('/', urlUtils.getSubdir(), urlUtils.STATIC_IMAGE_URL_PREFIX,
                    path.relative(config.getContentPath('images'), targetFilename));

                return image;
            });
        });
    }
};

module.exports = ImageHandler;
