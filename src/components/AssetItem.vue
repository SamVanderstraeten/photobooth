<template>
    <article>
        <h4>{{ name }}</h4>
        <span>{{ url }}</span>
    </article>
</template>

<script setup>
defineProps({
    name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
article {
    border: 2px solid #aaa;
}

article:hover {
    background-color: rgba(160,190,160,0.6);
    cursor: pointer;
}
</style>