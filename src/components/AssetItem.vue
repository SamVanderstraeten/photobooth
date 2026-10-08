<template>
    <article :class="{'selected': selected}" :title="displayName">
        <picture>
            <img :src="asset.url" :alt="displayName" />
        </picture>
        <span class="name">{{ displayName }}</span>
    </article>
</template>

<script setup>
    import { computed } from 'vue';

    const props = defineProps({
        asset: {
            type: Object,
            required: true
        },
        selected: {
            type: Boolean,
            default: false
        }
    });

    const displayName = computed(() => (props.asset.name || '').replace(/\.[^.]+$/, ''));
</script>

<style scoped>
article {
    flex: 0 0 auto;
    width: 160px;
    height: 100%;
    padding: 8px 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #fff;
    opacity: 0.6;
}

article:hover {
    cursor: pointer;
    opacity: 0.85;
}

article.selected {
    opacity: 1;
}

picture {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    display: flex;
    justify-content: center;
}

picture img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.name {
    flex: 0 0 auto;
    margin-top: 4px;
    width: 100%;
    font-size: 0.8rem;
    line-height: 1.2;
    text-align: center;
    overflow-wrap: anywhere;
}
</style>
