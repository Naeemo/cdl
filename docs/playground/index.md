<script setup>
import Playground from './Playground.vue'
</script>

<div class="playground-container">
  <Playground />
</div>

<style>
.playground-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (max-width: 768px) {
  .playground-container {
    padding: 0 16px;
  }
}
</style>