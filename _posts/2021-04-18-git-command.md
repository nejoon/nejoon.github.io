---
layout: post
title:  "자주쓰는 git command정리"
author: nejoon kim
category: dev
tags:	dev
comments: true
---

## 자주 쓰는 git command

이 포스트에서는 자주쓰는 git command에 대해 정리해봤습니다.

### git clone

깃허브에는 소스가 있고 내 컴퓨터에는 없는 상황에서
그 소스를 내 로컬로 가져오는 행위
서버에서 로컬로 리포지토리를 통째로 복사해오는것이 바로 clone

### git init (in)

작업하는것을 초기화하는것

### git add

새로운 파일을 추가 하는것

### git commit

레포지토리에 작업한 내용을 확정하는것 추가해서 확정을 하는것 add->commit

### git push

commit한것을 올리는것

### git pull

```
git pull origin 연우장난감상자
```

하면 저장소에서 최신의 연우장난감상자를 가져오는거임
다른사람이 반영시킨것을 나에게도 그대로 반영시키는 것

```
git pull origin main
```

### git checkout -b xxx

새로운 상자(branch)를 만들어주는 명령어

```
git checkout -b feature/지현상자
```


### git checkout xxx


상자를 이동할때 쓰는 명령어

내가 사용할 브런치를 지정하는 의미



### git checkout xxx -- 변경할파일

이 커맨드는 특정파일만 다른 저장소(상자)의 것으로 가져오고 싶을떄 사용한다.

#### 자주사용하는 커맨드

```
git checkout origin/main -- 김치.md
```

만약에 연우상자의 미미장난감이라는 파일만 가져오고 싶으면? 아래와 같이 쓴다.

```
git checkout origin/연우상자 -- 미미장난감.md
```




## git config

git을 처음 사용할때 필요할 설정

```
git config --global user.name "nejoon"
git config --global user.email "xx@naver.com"
```

---

## 메모

### git pull vs git pull origin xx의 차이는??

지목해서 가져오는거랑 현재 최신것을 가져오는 차이

`git pull`만 하면 현재 작업중인 상자에 해당하는 최신 냉장고의것을 가져오고

`git pull origin 연우상자`하면 지목해서 연우상자라는 브랜치의 최신정보를 가져오는것임.


### origin과 origin이 없는 상자의 차이

origin이 붙으면 냉장고

origin이 없으면 내방

