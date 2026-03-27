---
layout: page
title: CDL Playground
description: 在线编写和预览 CDL 图表，支持 v0.6 高级特性（组合图、多轴、交互）
pageClass: playground-page
---

<script setup>
import Playground from './Playground.vue'
</script>

<Playground />

<style>
.playground-page .vp-page {
  padding: 0 !important;
  max-width: none !important;
}
.playground-page .container {
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
}
</style>