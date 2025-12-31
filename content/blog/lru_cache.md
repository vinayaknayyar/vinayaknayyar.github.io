---
date: '2025-12-31'
draft: false
tags: [Operating System, Computer Architecture, DSA]
title: 'Demystifying the LRU Cache'
math: false
---

## Problem Statement
In the world of high-performance computing, speed is everything. When applications scale, the bottleneck is often the time it takes to fetch data from slow storage layers. This is where caching comes into play.


## 1. What is a Cache?

In computing, a cache is a small, fast storage layer that keeps copies of data so future requests for that data can be served faster. It sits between a slow data source (disk, network, database, main  memory) and the consumer (CPU, application, browser), trading space for time.

Typical examples where caches are used:
1. CPU caches (L1/L2/L3) storing recently used data to reduce main-memory(SRAM vs DRAM) latency.  
2. Database caches holding hot query results or key–value objects in RAM.  
3. Web and CDN caches storing HTTP responses close to users to reduce latency and save bandwidth.  

Caches matter because most workloads exhibit **[temporal locality](https://en.wikipedia.org/wiki/Locality_of_reference)** and **[spatial locality](https://en.wikipedia.org/wiki/Locality_of_reference)**; computer systems rely on the past as a predictor of what is likely to happen next, i.e. *'recently accessed'* or *'nearby data'* is likely to be accessed again soon, so keeping it close significantly improves throughput and tail latency[1].

## 2. Types of Caching Strategies

A cache has finite capacity, so when it is full, it must decide **which** entry to evict to make room for new data, this decision policy is the cache eviction or cache replacement strategy.  

Some widely used strategies include:
#### FIFO (First In, First Out)
- Evicts the oldest inserted item regardless of how often it was used.
- Simple to implement but can perform poorly when old items are still hot.

#### Random replacement
- Evicts a random entry.  
- Easy and cheap but may evict frequently used items by chance.

#### LRU (Least Recently Used) 
- Evicts the entry that has not been used for the longest time.  
- Exploits temporal locality and is often a good default in practice.

#### LFU (Least Frequently Used)  
- Evicts the item with the lowest access count.  
- Captures long‑term popularity but is more complex to maintain efficiently.

Real systems (e.g., Redis, OS page replacement, web caches) often use LRU or approximations of it because it balances hit rate with implementation simplicity.

## 3. What is an LRU Cache?
An LRU (Least Recently Used) cache is a fixed‑capacity key–value store that always evicts the **least recently accessed** entry when it needs space. “Accessed” means either read (`get`) or write (`put/update`); every access marks that key as most recently used.

### Designing the LRU cache
As caching is all about speed, it's needless to say that we need a data structure (or a combination) that supports data storage, data retrieval and data eviction in the least possible time O(1).

Here's an analysis of different data structures and the Time Complexity(TC) for these operations
|Data Structure|Store|Retrieve|Evict|
|--------------|-----|--------|-----|
|Array (Unsorted)| O(1) add, O(n) update(linear search)|O(n) linear search| O(1) if LRU is known index like front/end|
|Array (Sorted)| O(n) rearrangement reqd to keep array sorted|O(logn) binary search| O(1) if LRU is known index like front/end|
|Linked List (Singly/Doubly)| O(1) insert @ head/tail, O(n) update| O(n) linear search| O(1) if LRU is @ head/tail|
|Hash Map| O(1) insertion/update|O(1) lookup| O(n) to find LRU|
|Balanced BST| O(logn) insertion/update|O(logn) lookup| O(logn) to find LRU|

No single structure satisfies all the three requirements. Therefore we go with a combination of Linked list and Hashmap that together satisfy all the three operations in O(1) when properly/correctly used.


### How it Works:
To achieve O(1) TC for both `put/update` and `get` operations, we utilise the combination as below:
1.  A Doubly Linked List: To maintain the order of usage[2]. The front is the Most Recently Used (MRU), and the back is the Least Recently Used (LRU).
2.  A Hash Map (unordered_map): To provide fast access to the nodes in the linked list using a key.

#### High‑level behavior:
##### On `get(key)`  
  1. If the key exists, return its value and mark that entry as most recently used.  
  2. If not, report a miss (commonly via `std::optional` or sentinel value).  

##### On `put(key, value)`  
  1. If the key already exists, update its value and mark it as most recently used.  
  2. If it does not exist and the cache is not full, insert it as most recently used.  
  3. If the cache is full, evict the least recently used entry, then insert the new one as most recently used.  

To support both O(1) lookups and O(1) updates of the “recency” order, the classic implementation combines:  
1. A hash table (`std::unordered_map`) mapping keys to nodes.  
2. A doubly linked list (`std::list`) ordered from most recently used (front) to least recently used (back).  


## 4. Implementation of LRU Cache in C++ 11

Below is a possible implementations using `std::list` and `std::unordered_map`.

```cpp
#include <iostream>
#include <unordered_map>
#include <list>
#include <utility>

class LRUCache {
private:
    int capacity;
    // List stores pairs of {key, value}
    std::list<std::pair<int, int>> cacheList;
    
    // Map stores key -> iterator to the node in cacheList
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> cacheMap;

public:
    LRUCache(int cap) : capacity(cap) {}

    int get(int key) {
        if (cacheMap.find(key) == cacheMap.end()) {
            return -1; // Key not found
        }
        // Move the accessed item to the front (MRU)
        cacheList.splice(cacheList.begin(), cacheList, cacheMap[key]);
        return cacheMap[key]->second;
    }

    void put(int key, int value) {
        if (cacheMap.find(key) != cacheMap.end()) {
            // Key exists: update value and move to front
            cacheList.splice(cacheList.begin(), cacheList, cacheMap[key]);
            cacheMap[key]->second = value;
            return;
        }

        if (cacheList.size() == capacity) {
            // Cache full: remove the LRU item (from the back)
            int lastKey = cacheList.back().first;
            cacheList.pop_back();
            cacheMap.erase(lastKey);
        }

        // Add new item to the front
        cacheList.push_front({key, value});
        cacheMap[key] = cacheList.begin();
    }
};
```


## 5. Validating the functionality
Using Google Test (GTest) to validate the cache behaviour under various scenarios.

```cpp
#include <gtest/gtest.h>

// Test case for basic Put and Get
TEST(LRUCacheTest, BasicOperations) {
    LRUCache cache(2);
    cache.put(1, 10);
    cache.put(2, 20);
    EXPECT_EQ(cache.get(1), 10);
    cache.put(3, 30);            // Evicts key 2
    EXPECT_EQ(cache.get(2), -1); // Should not be found
    EXPECT_EQ(cache.get(3), 30);
}

// Test case for updating existing keys
TEST(LRUCacheTest, UpdateKey) {
    LRUCache cache(2);
    cache.put(1, 10);
    cache.put(1, 15);
    EXPECT_EQ(cache.get(1), 15);
}

// Test case for LRU Eviction Logic
TEST(LRUCacheTest, EvictionLogic) {
    LRUCache cache(2);
    cache.put(1, 1);
    cache.put(2, 2);
    cache.get(1);      // Key 1 becomes MRU, Key 2 is now LRU
    cache.put(3, 3);   // Should evict Key 2
    EXPECT_EQ(cache.get(2), -1);
    EXPECT_EQ(cache.get(1), 1);
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
```

## Final Wrap Up
A cache is a fast but limited storage layer used to hide slow operations; choosing a good eviction policy is crucial for its effectiveness. The LRU cache is a cornerstone of systems design, balancing simplicity with high performance. By utilizing a Doubly Linked List for ordering and a Hash Map for O(1) lookups, we create a system that intelligently keeps the most relevant data at our fingertips.

Whether you are optimizing a database or building a high-traffic web server, understanding these caching fundamentals is essential for any software engineer.

## Further Reading
1. [LRU Cache - Wikipedia](https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU)
2. [GeeksforGeeks: LRU Cache Implementation](https://www.geeksforgeeks.org/lru-cache-implementation/)
3. [LeetCode Problem 146: LRU Cache](https://leetcode.com/problems/lru-cache/)

## References
[1] [Tail Latency - GeeksforGeeks](https://www.geeksforgeeks.org/system-design/long-tail-latency-problem-in-microservices/) Long-tail latency refers to the disproportionate impact of a small percentage of requests that take significantly longer to process than the majority of requests.

[2] [`std::list` Splicing - cppreferences](https://en.cppreference.com/w/cpp/container/list/splice.html) C++'s std::list provides a member function called splice() which can transfer elements from one list to another, or reposition elements within the same list, with constant time complexity (O(1)) by simply reassigning internal pointers.