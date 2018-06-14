/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/



module.exports = function(grunt) {

  grunt.initConfig({
    purifycss: {
      options: {},
      target: {
        src: ['/*.html', 'js/*.js'],
        css: ['css/*.css'],
        dest: 'purestyles/purestyles.css'
      },
    },
    responsive_images: {
      dev: {
        options: {
          engine: 'im',
          sizes: [{
            width: '1600',
            suffix: '-large',
            quality: '25'
          }, 
          {
            width: '800',
            suffix: '-medium',
            quality: '25'
          }, {
            width: '400',
            suffix: '-small',
            quality: '25'
          
          }]
        },

        /*
        You don't need to change this part if you don't change
        the directory structure.
        */
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img_src/',
          dest: 'img_dist/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['img_dist'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['img_dist']
        },
      },
    },

    /* Copy the "fixed" images that don't go through processing into the images/directory */
    copy: {
      dev: {
        files: [{
          expand: true,
          src: 'img_src/fixed/*.{gif,jpg,png}',
          dest: 'img_dist/'
        }]
      },
    },
  });
  
  grunt.loadNpmTasks('grunt-purifycss');
  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images']);

};
