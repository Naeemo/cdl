import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'CDL',
  description: 'Chart Definition Language - 图表定义语言',
  
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '文档', link: '/guide/' },
      { text: 'Playground', link: '/playground/' },
      { text: '示例', link: '/examples/' }
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/' },
            { text: '语法规范', link: '/guide/syntax' },
            { text: '数据查询', link: '/guide/data' },
            { text: '图表类型', link: '/guide/charts' }
          ]
        }
      ],
      '/examples/': [
        {
          text: '示例',
          items: [
            { text: '折线图', link: '/examples/line' },
            { text: '柱状图', link: '/examples/bar' },
            { text: '饼图', link: '/examples/pie' },
            { text: '更多图表', link: '/examples/more' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Naeemo/cdl' }
    ]
  },
  
  base: '/cdl/',
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ]
})
