<template>
    <article>
        <picture>
            <img :src="asset.url" alt="asset.name" />
        </picture>

        <section>   
            <h4>{{ asset.name }}</h4>
            <span>{{ asset.url }}</span>
        </section>
    </article>
</template>

<script setup>
    defineProps({
        asset: {
            type: Object,
            required: true
        }
    });
</script>

<style scoped>
article {
    border: 2px solid #aaa;
    padding: 12px;
    display: flex;
    color: #ddd;
}

article:hover {
    background-color: rgba(160,190,160,0.6);
    cursor: pointer;
}

article picture {
    flex-grow: 1;
}

article picture img {
    width: auto;
    height: 60px;
}

article section {
    flex-grow: 5;
}
</style>