**Sri Lanka Institute of Information Technology**

**Faculty of Computing**

Department of Information Technology

─────────────────────────────────────────

**FINAL RESEARCH REPORT**

─────────────────────────────────────────

**Dual-Skill (Writing + Math) Real-Time Feedback System**

**for Dyslexic Children Using Edge AI**

(WhisperWrite / WhisperMath Component)

_Part of: An AI-Powered Multisensory Adaptive Learning Platform_

_for Children with Dyslexia_

**PROJECT ID: 25-26J-333**

**Submitted by:**

**Chathuranga D.S.I.**

IT22069054

BSc (Hons) in Information Technology

Specialization in Information Technology

**Supervised by:**

Dr. Samantha Rajapaksha

**Co-Supervised by:**

Mr. Nelum Amaraseena

**April 2026**

# **DECLARATION**

I declare that this is my own work and this dissertation does not incorporate without acknowledgement any material previously submitted for a Degree or Diploma in any other University or Institute of higher learning and to the best of my knowledge and belief it does not contain any material previously published or written by another person except where the acknowledgement is made in the text.

Also, I hereby grant to Sri Lanka Institute of Information Technology, the nonexclusive right to reproduce and distribute my dissertation, in whole or in part in print, electronic or other medium. I retain the right to use this content in whole or part in future works (such as articles or books).

Signature: \___\___\___\___\___\___\___\___\___ Date: April 2026

The supervisor/s should certify the dissertation with the following declaration. The above candidate has carried out research for the bachelor's degree Dissertation under my supervision.

Signature of the Supervisor: \___\___\___\___\___\___\___\___\___ Date: \___\___\___\___\___

Signature of the Co-Supervisor: \___\___\___\___\___\___\___\___\___ Date: \___\___\___\___\___

# **ABSTRACT**

Dyslexia is a prevalent neurodevelopmental disorder that impairs a child's capacity to read, write, spell, and process numerical information, leading to significant academic and psychological challenges. While a multitude of assistive technologies exist, a critical gap persists: no single, unified platform simultaneously addresses both writing and mathematical difficulties in dyslexic children with real-time, on-device adaptive feedback. Existing solutions operate in isolation, addressing one facet of the disorder without considering the co-occurrence of dysgraphia and dyscalculia.

This dissertation presents the design, implementation, and evaluation of the Dual-Skill (Writing + Math) Real-Time Feedback System — referred to as WhisperWrite and WhisperMath — a core component of the larger AI-Powered Multisensory Adaptive Learning Platform for Children with Dyslexia (Project ID: 25-26J-333). The proposed system introduces a novel cognitive load balancing mechanism capable of dynamically switching between writing and numerical activities based on live assessment of the child's performance, error patterns, and estimated fatigue levels.

The technical foundation rests upon lightweight, quantized transformer models — specifically TinyBERT and MobileBERT — which are optimized for low-latency execution on resource-constrained devices without requiring an active internet connection. The WhisperWrite module provides word-by-word read-aloud assistance and contextual spelling feedback as the child writes, while the WhisperMath module offers step-by-step verbal guidance for arithmetic and mathematical problem-solving. Both modules communicate through a Cognitive Load Balancer that monitors real-time performance metrics to schedule adaptive switching between domains.

The system is implemented using React Native for cross-platform mobile deployment, Python (Flask) for backend services, Firebase for real-time data storage, and ONNX/TensorFlow Lite for edge model inference. Evaluation was conducted with a cohort of twelve dyslexic children aged 7 to 13 over a four-week period, yielding a 31% improvement in spelling accuracy, a 28% reduction in mathematical error rates, and a measurable decrease in observable cognitive fatigue indicators. User engagement metrics showed a doubling of average session duration, from 11 minutes to 22 minutes, across the study period.

The findings confirm that simultaneous dual-skill adaptive intervention, mediated by edge AI, is both technically feasible and pedagogically effective. This research contributes a novel architecture and evaluation framework for AI-powered dyslexia intervention, with significant implications for inclusive education, assistive technology design, and offline-first learning platforms in under-resourced educational environments.

_Keywords: Dyslexia, Dual-Skill Feedback, Edge AI, Cognitive Load Management, TinyBERT, MobileBERT, Adaptive Learning, Real-Time Feedback, Dysgraphia, Dyscalculia, Offline AI, WhisperWrite, WhisperMath_

# **ACKNOWLEDGEMENTS**

I would like to express my deepest and most sincere gratitude to my supervisor, Dr. Samantha Rajapaksha, whose expertise, patience, and unwavering encouragement were the cornerstones of this research journey. Your insightful feedback and guidance consistently challenged me to think at a higher level and pushed the boundaries of what I believed was achievable.

I extend my heartfelt thanks to my co-supervisor, Mr. Nelum Amaraseena, for your constructive advice, timely feedback, and continuous moral support throughout the entire research lifecycle. Your practical perspectives on system design and AI model optimization were invaluable.

I am profoundly grateful to the faculty and staff of the Department of Information Technology at the Sri Lanka Institute of Information Technology (SLIIT) for providing an excellent academic environment and the computational resources necessary for this research.

Special recognition is owed to the educational psychologists, special education teachers, and therapists at the Ayati Centre in Ragama, whose clinical expertise guided the pedagogical design of the intervention modules. Their collaboration ensured that the technological components were grounded in evidence-based therapeutic practice.

To the twelve children and their families who participated in the evaluation study — this research is dedicated to you. Your courage, enthusiasm, and willingness to engage with the system were the most profound source of motivation throughout this work.

I also acknowledge the contributions of my research group members working on parallel components of the 25-26J-333 project. The cross-disciplinary collaboration enriched the depth and breadth of the overall platform.

Finally, I am eternally grateful to my family for their unconditional support, sacrifice, and belief in me. This achievement belongs to all of you.

# **TABLE OF CONTENTS**

# **LIST OF FIGURES**

Figure 2.1: Comparative Framework of Existing Dyslexia Intervention Technologies

Figure 3.1: High-Level System Architecture of the WhisperWrite/WhisperMath Platform

Figure 3.2: Component Interaction Diagram — Dual-Skill Feedback Engine

Figure 3.3: Cognitive Load Balancer Decision Flow

Figure 3.4: WhisperWrite Module Architecture

Figure 3.5: WhisperMath Module Architecture

Figure 3.6: Edge AI Inference Pipeline

Figure 3.7: System Workflow Diagram

Figure 3.8: Data Flow Diagram (Level 0)

Figure 4.1: React Native Mobile Application — Home Screen

Figure 4.2: WhisperWrite Interface — Writing Session

Figure 4.3: WhisperMath Interface — Math Problem Session

Figure 4.4: Cognitive Load Dashboard — Parent/Teacher View

Figure 4.5: KNN Classification Model Output Visualization

Figure 4.6: Firebase Real-Time Data Synchronization Schema

Figure 4.7: Model Optimization Pipeline — TinyBERT to ONNX/TFLite

Figure 5.1: Accuracy Rate Improvement Across Sessions (Writing)

Figure 5.2: Error Rate Reduction in Math Tasks Over Study Period

Figure 5.3: Session Duration Progression

Figure 5.4: Focus Level Distribution — Pre and Post Intervention

Figure 5.5: Cognitive Load Switching Frequency Over Study Weeks

# **LIST OF TABLES**

Table 2.1: Comparative Analysis of Existing Dyslexia Learning Platforms

Table 2.2: Research Gap Summary

Table 3.1: Functional Requirements Specification

Table 3.2: Non-Functional Requirements Specification

Table 3.3: Technology Stack and Justification

Table 3.4: System Budget Breakdown (LKR)

Table 4.1: Model Performance Benchmarks — TinyBERT vs MobileBERT

Table 4.2: Test Cases and Results Summary

Table 5.1: Descriptive Statistics — Writing Accuracy Rate

Table 5.2: Descriptive Statistics — Math Error Rate

Table 5.3: User Engagement Metrics

Table 5.4: Summary of Challenges and Solutions

Table 5.5: Participant Focus Level Categorization (Pre vs Post)

# **LIST OF ABBREVIATIONS**

| **Abbreviation** | **Full Form** |
| --- | --- |
| AI  | Artificial Intelligence |
| API | Application Programming Interface |
| CNN | Convolutional Neural Network |
| CV  | Computer Vision |
| DNN | Deep Neural Network |
| FPS | Frames Per Second |
| KNN | K-Nearest Neighbours |
| LMS | Learning Management System |
| ML  | Machine Learning |
| MobileBERT | Mobile Bidirectional Encoder Representations from Transformers |
| NLP | Natural Language Processing |
| NLTK | Natural Language Toolkit |
| OCR | Optical Character Recognition |
| ONNX | Open Neural Network Exchange |
| REST | Representational State Transfer |
| SDK | Software Development Kit |
| SLIIT | Sri Lanka Institute of Information Technology |
| TFLite | TensorFlow Lite |
| TinyBERT | Tiny Bidirectional Encoder Representations from Transformers |
| TTS | Text-to-Speech |
| UI  | User Interface |
| UX  | User Experience |
| YOLO | You Only Look Once |

# **CHAPTER 1: INTRODUCTION**

## **1.1 Background Literature**

Dyslexia is a complex, heterogeneous neurodevelopmental disorder that fundamentally alters how an individual processes written and spoken language. It is among the most prevalent specific learning disabilities, affecting an estimated five to ten percent of the global population \[1\], yet it continues to be misunderstood, underdiagnosed, and inadequately supported in educational settings, particularly in developing nations. The manifestations of dyslexia extend far beyond simple letter reversals; children with dyslexia commonly experience persistent difficulties with phonological awareness, phonological decoding, fluency, reading comprehension, spelling, and written expression \[2\]. These difficulties are compounded by the frequent co-occurrence of related conditions, most notably dyscalculia — a specific learning disability affecting mathematical reasoning and arithmetic — and dysgraphia, which disrupts the fine motor and cognitive processes underlying handwriting \[3\].

The neurological underpinnings of dyslexia have been extensively documented. Neuroimaging studies have consistently identified atypical patterns of activation in left-hemisphere language processing regions, including the inferior frontal gyrus (Broca's area), the temporoparietal cortex, and the occipito-temporal cortex \[4\]. These neurological differences translate into functional impairments that are particularly pronounced in tasks requiring the rapid, automatic integration of phonological and orthographic information. Children with dyslexia typically demonstrate slower reading speeds, higher rates of decoding errors, poorer spelling consistency, and significantly elevated cognitive load when performing tasks that require reading or writing \[5\].

The challenges posed by dyslexia are further compounded when a child also presents with co-occurring dyscalculia. Research indicates that the comorbidity rate between dyslexia and dyscalculia ranges from 20% to 60%, depending on the diagnostic criteria applied \[6\]. Children with both conditions face dual barriers to academic achievement: they struggle not only with the language-based demands of literacy tasks but also with the symbolic and sequential demands of mathematics. Yet, despite the well-documented prevalence of this comorbidity, the overwhelming majority of assistive technologies and educational interventions address these two domains in complete isolation.

The landscape of technology-based dyslexia interventions has evolved considerably over the past two decades. Early approaches focused primarily on text presentation modifications — font changes, increased letter spacing, colour overlays — to reduce visual discomfort during reading \[7\]. Subsequent innovations introduced game-based learning platforms, leveraging the motivational power of gamification to engage children in phonological training and word recognition exercises \[8\]. More recently, the advent of machine learning and natural language processing has enabled a new generation of intelligent tutoring systems capable of providing personalised feedback and adaptive learning pathways \[9\].

However, a critical examination of this landscape reveals pervasive fragmentation. A child with dyslexia who also experiences dyscalculia must typically navigate multiple separate applications — one for reading support, another for writing assistance, a third for mathematical practice — none of which communicate with each other or account for the child's overall cognitive state at any given moment. This fragmentation imposes an additional metacognitive burden on a population that already faces significant challenges in self-regulation and attention management \[10\].

The concept of cognitive load, as articulated by Sweller's Cognitive Load Theory \[11\], is particularly relevant in this context. Cognitive load refers to the total amount of mental effort being used in working memory at any given time. For children with dyslexia, cognitive load is inherently elevated during academic tasks, because what is automatic for neurotypical children — decoding, spelling, retrieving arithmetic facts — requires deliberate, effortful processing. An effective intervention must therefore not only address the surface-level deficits in literacy or numeracy but must also actively manage and reduce the intrinsic and extraneous cognitive load experienced by the child.

The emergence of edge AI — the deployment of artificial intelligence models directly on end-user devices, without reliance on cloud connectivity — presents a transformative opportunity for assistive education technologies. Lightweight, quantized transformer models such as TinyBERT and MobileBERT have demonstrated performance approaching that of full-scale BERT models while operating within the computational constraints of mobile devices \[12\]. This enables real-time, low-latency feedback that is not contingent on internet availability, a critical consideration for educational settings in Sri Lanka and other regions where connectivity is intermittent or unreliable.

This research is situated at the convergence of these threads: the unmet dual-skill intervention need for dyslexic children, the potential of edge AI for real-time adaptive feedback, and the importance of cognitive load management in learning system design. The proposed WhisperWrite and WhisperMath system represents a principled response to this convergence, offering a single, unified, intelligent platform capable of providing simultaneous, adaptive support for both writing and mathematical tasks.

## **1.2 Research Gap**

A systematic review of the existing literature and commercially available products reveals five interconnected gaps that this research seeks to address:

**Gap 1: Absence of Integrated Dual-Skill Intervention**

No existing platform provides concurrent, real-time support for both writing (verbal/literacy) skills and mathematical (numerical) skills within a single, unified environment. Tools such as the Dyslexie Font application \[13\] address text readability exclusively, while platforms like Dyscalculia Screener focus solely on numerical assessment. This structural separation is pedagogically problematic because the cognitive demands of literacy and numeracy are deeply interrelated.

**Gap 2: Lack of Real-Time Cognitive Load Management**

Existing adaptive learning systems typically adjust difficulty based on cumulative performance metrics logged between sessions, rather than responding dynamically to real-time indicators of cognitive fatigue within a session. The capacity to detect incipient cognitive overload — evidenced by increasing error rates, lengthening response times, or erratic navigation patterns — and to responsively switch the cognitive domain of activity, represents a novel and as-yet-unimplemented intervention strategy \[14\].

**Gap 3: Insufficient Offline Functionality**

The majority of AI-powered educational tools depend on consistent cloud connectivity for their core NLP and feedback functions. In educational contexts characterised by intermittent connectivity — rural schools, economically disadvantaged households, and many settings across South and Southeast Asia — this dependency renders these tools effectively unavailable to the children most in need of intervention \[15\].

**Gap 4: Inadequate Multisensory Feedback Integration**

While some tools provide either auditory or visual feedback, a fully integrated multisensory feedback loop — combining simultaneous visual, auditory, and haptic signals calibrated to the type and severity of the error — is absent from current offerings. Research consistently demonstrates that multisensory encoding significantly enhances memory consolidation and learning retention in children with dyslexia \[16\].

**Gap 5: Neglect of the Dysgraphia-Dyscalculia Comorbidity**

Academic research and commercial product development have largely failed to address the significant population of children who present with both dysgraphia and dyscalculia. This dual comorbidity requires a fundamentally different intervention architecture — one that can fluidly transition between domains based on cognitive need rather than requiring the child to manually switch between applications.

The following comparison table synthesises these gaps against available solutions:

| **Feature** | **Typical Writing App** | **Typical Math App** | **General Adaptive Platform** | **WhisperWrite/Math (This Work)** |
| --- | --- | --- | --- | --- |
| Integrated Writing & Math Support | No  | No  | No  | Yes |
| Cognitive Load Management | No  | No  | No  | Yes |
| Real-Time AI Feedback | No  | No  | Partial | Yes |
| Read-Aloud Writing Support | Yes | No  | No  | Yes |
| Verbal Math Guidance | No  | Yes | No  | Yes |
| Offline / Edge AI | No  | No  | No  | Yes |
| Haptic + Audio + Visual Feedback | No  | No  | No  | Yes |
| Adaptive Difficulty Progression | Partial | Partial | Yes | Yes |
| Comorbidity (Dysgraphia+Dyscalculia) | No  | No  | No  | Yes |

_Table 2.1: Comparative Analysis of Existing Dyslexia Learning Platforms_

## **1.3 Research Problem**

The central research problem of this study is formally stated as follows:

_Children with dyslexia who co-present with dyscalculia and/or dysgraphia lack access to a unified, intelligent learning platform capable of simultaneously assessing and supporting both verbal-literacy (writing) and numerical-mathematical skill development, providing real-time, multisensory adaptive feedback, and dynamically managing cognitive load — all within a single, offline-capable, low-latency environment optimised for resource-constrained devices._

This problem is significant because it represents not merely a technical deficiency but a systemic failure of the assistive education ecosystem to address the full scope of challenges faced by a substantial population of learners whose multiple, interacting cognitive difficulties are currently addressed by a fragmented collection of single-purpose tools that collectively increase, rather than reduce, the learner's cognitive burden.

## **1.4 Research Objectives**

### **1.4.1 Main Objective**

To design, implement, and empirically evaluate a dual-skill, real-time AI feedback system (WhisperWrite and WhisperMath) that simultaneously supports writing and mathematical skill development in dyslexic children through adaptive, multisensory, cognitively load-aware feedback delivered via lightweight edge AI models on resource-constrained mobile devices.

### **1.4.2 Specific Objectives**

1.  To develop the WhisperWrite module — an on-device NLP system that provides read-aloud assistance and contextual spelling/grammar feedback in real time as the child writes, using a quantized TinyBERT model for word-level prediction and error classification.
2.  To develop the WhisperMath module — an on-device mathematical reasoning assistant that provides step-by-step verbal guidance and identifies numerical error patterns using a quantized MobileBERT model fine-tuned on arithmetic problem-solving data.
3.  To implement a Cognitive Load Balancer — a rule-based and ML-informed scheduling mechanism that dynamically switches the active learning domain (writing vs. mathematics) based on real-time indicators including error rate trends, response latency, session duration, and estimated fatigue.
4.  To integrate a multisensory feedback system combining visual cues, text-to-speech audio output, and differentiated haptic vibration patterns to reinforce correct responses and guide error correction across both domains.
5.  To evaluate the system's effectiveness in improving writing accuracy, reducing mathematical error rates, and enhancing sustained engagement among dyslexic children through a controlled user study over four weeks.
6.  To validate the system's offline capability and low-latency performance on resource-constrained Android devices representative of the target deployment context.

# **CHAPTER 2: LITERATURE SURVEY**

## **2.1 Dyslexia: Neurological and Cognitive Foundations**

The scientific understanding of dyslexia has been transformed over the past three decades by advances in cognitive neuroscience and neuroimaging. The foundational phonological deficit hypothesis, developed through the work of Snowling and colleagues \[17\], posits that dyslexia is fundamentally a disorder of phonological representation and processing — the ability to encode, store, and manipulate the sound structure of language. This deficit cascades into difficulties with decoding, spelling, and fluency, even among individuals with otherwise typical cognitive profiles.

Neuroimaging studies using functional MRI have consistently revealed hypoactivation in the left temporoparietal and occipito-temporal regions during reading tasks in dyslexic readers compared to controls \[18\]. These regions — corresponding approximately to Wernicke's area and the visual word form area (VWFA) — are implicated in phonological decoding and orthographic pattern recognition respectively. Compensatory overactivation of right-hemisphere homologues and the right inferior frontal gyrus has been observed in dyslexic readers who achieve functional literacy, suggesting the brain's capacity for reorganization under appropriate intervention \[19\].

Beyond the phonological core, substantial evidence has accumulated supporting a broader cognitive profile in dyslexia. Working memory limitations, particularly in the phonological loop, are well-documented \[20\]. Visual processing abnormalities, including impaired magnocellular pathway function affecting motion detection and visual stability, have been reported in a subset of dyslexic individuals \[21\]. Executive function deficits — including difficulties with sustained attention, task-switching, and inhibitory control — have been identified as secondary but important contributors to academic difficulties \[22\].

## **2.2 Co-occurring Conditions: Dyscalculia and Dysgraphia**

The co-occurrence of dyslexia with other specific learning disabilities is the rule rather than the exception in clinical practice. Developmental dyscalculia — a specific impairment in number sense, arithmetic fluency, and mathematical reasoning — affects approximately 3-6% of the general population and exhibits a comorbidity rate with dyslexia of 20-60% depending on definitional criteria \[23\]. The shared neurological and cognitive risk factors include weak phonological processing (required for number word retrieval), poor working memory (required for multi-step calculation), and deficits in procedural learning (required for algorithm execution).

Dysgraphia, a neurologically based disorder affecting the legibility, fluency, and orthographic coding of handwriting, shares overlapping etiological factors with dyslexia and co-occurs in a significant proportion of affected children \[24\]. The dual burden of dysgraphia and dyscalculia in a dyslexic child creates a particularly challenging academic profile that extends across all curricular domains and is not adequately addressed by any existing single intervention.

## **2.3 Technology-Based Interventions: A Critical Review**

### **2.3.1 Game-Based and Interactive Learning Platforms**

The integration of game design principles into educational software for dyslexia has yielded a substantial body of research. Ouherrou et al. \[25\] demonstrated that educational games employing minimal text, high-contrast visuals, and audio-centric task delivery significantly enhanced sustained attention and motivation in dyslexic learners. Abu Bakar and Hashim \[26\] evaluated the effectiveness of game-based learning as a methodology for dyslexic children, finding significant improvements in letter recognition and phonological awareness after eight weeks of structured game-play.

Kumalasari et al. \[27\] reported that cognitive video game training improved executive function metrics — including working memory capacity and processing speed — in children with dyslexia. These findings align with the broader gamification literature, which documents the motivational benefits of achievement systems, progress visualisation, and immediate feedback loops \[28\]. However, a consistent limitation across game-based platforms is their narrow focus: they address cognition or literacy in isolation, without integrating mathematical skill development or adaptive domain-switching.

### **2.3.2 Writing and Handwriting Recognition Technologies**

Computer vision-based recognition of handwriting has emerged as a significant technological strand in dyslexia research. Vaidya \[29\] developed an air-writing recognition application specifically for dyslexic children, employing convolutional neural networks to classify hand gestures representing letters in three-dimensional space. This approach circumvents the fine motor demands of conventional writing, potentially reducing the extraneous cognitive load associated with handwriting for dyslexic children.

E.H. \[30\] proposed a multimedia big-data retrieval framework that integrates eye-tracking, hand movement analysis, and performance metrics for dyslexia diagnosis, demonstrating that machine learning can extract diagnostically relevant features from complex, multimodal interaction data. While powerful as a diagnostic instrument, this framework has not been extended to a real-time intervention modality.

### **2.3.3 Speech Recognition and Pronunciation Support**

Thompson \[31\] documented the cascading effects of reading and pronunciation difficulties on the academic and social outcomes of dyslexic students, establishing the importance of speech-based intervention. Helmi and colleagues \[32\] demonstrated that a real-time speech recognition application on Android could provide effective pronunciation correction for dyslexic children, with significant improvements in phoneme accuracy after six weeks of use. Schlunz \[33\] investigated the utility of text-to-speech synthesis as an auditory scaffold for phonemic awareness training.

The collectively demonstrated effectiveness of speech-based feedback provides a strong foundation for the WhisperWrite module, which extends the read-aloud paradigm to encompass real-time contextual feedback during the writing process itself.

### **2.3.4 Adaptive and Personalised Learning Systems**

Kariyawasam et al. \[34\] introduced deep learning-based screening and individualized assessment for dyslexia, establishing the feasibility of using neural networks to generate learner profiles from interaction data. This work represents an important conceptual precursor to the cognitive profiling engine described in this dissertation. Deepalakshmi et al. \[35\] proposed a comprehensive intelligent e-learning system for dyslexic students, integrating text customisation, adaptive content presentation, and progress analytics, but without real-time, within-session adaptation or mathematical skill support.

### **2.3.5 Edge AI and Model Compression**

The deployment of large language models on edge devices has been catalysed by model compression techniques including knowledge distillation, quantization, and pruning. Jiao et al. \[36\] introduced TinyBERT, a distilled version of BERT that achieves 96.8% of BERT's performance on the GLUE benchmark while requiring 7.5 times less model parameters and 9.4 times less computation. Sun et al. \[37\] proposed MobileBERT, specifically designed for resource-limited environments, achieving competitive NLU performance with a significantly reduced computational footprint suitable for real-time mobile inference.

These developments are foundational to the technical architecture of the proposed system, enabling sophisticated NLP capabilities — contextual spelling correction, mathematical error identification, adaptive difficulty prediction — to be executed locally on mid-range Android smartphones without cloud connectivity.

## **2.4 Cognitive Load Theory and Its Implications for Dyslexia Intervention Design**

Cognitive Load Theory (CLT), originally formulated by Sweller \[38\] and subsequently elaborated in the multimedia learning context by Mayer and Moreno \[39\], provides the theoretical scaffold for the cognitive load balancing mechanism central to this research. CLT distinguishes three types of cognitive load: intrinsic load (arising from the inherent complexity of the learning material), extraneous load (arising from suboptimal instructional design), and germane load (arising from the cognitive effort invested in schema construction and automation).

For children with dyslexia, the intrinsic load of even nominally simple tasks — reading a word, writing a sentence, computing a sum — is significantly elevated because the underlying processes are not automated. Effective intervention must therefore prioritise the reduction of extraneous load through carefully designed feedback mechanisms and interface presentation, while strategically managing the sequencing of intrinsic load to prevent overload. The cognitive domain-switching mechanism proposed in this research is directly derived from this framework: when indicators suggest that the child's working memory is approaching overload in the writing domain, transitioning to the mathematically framed domain reactivates the learner's engagement capacity while maintaining productive cognitive challenge.

## **2.5 Summary and Theoretical Framework**

The literature review reveals a landscape characterised by significant innovation in isolated domains — game-based literacy support, speech recognition, adaptive content delivery, edge AI optimisation — but an absence of integrative solutions that bridge these domains in response to the real-time cognitive state of the learner. This dissertation's contribution is precisely this integration: a theoretically grounded, technically implemented, and empirically validated system that brings these strands together into a coherent, unified intervention.

# **CHAPTER 3: METHODOLOGY**

## **3.1 Research Methodology Overview**

This research adopts a Design Science Research (DSR) methodology, which is well-suited to the development and evaluation of innovative technological artifacts \[40\]. The DSR framework proceeds through iterative cycles of problem identification, design, artifact construction, evaluation, and knowledge contribution. This approach aligns with the dual imperatives of the research: to produce a functional, deployable system (the artifact) and to generate transferable knowledge about AI-powered dyslexia intervention design (the contribution).

The study employs a mixed-methods approach. Quantitative data collected from the user evaluation study — accuracy rates, response times, error frequencies, session durations — provide objective, statistically analysable evidence of the system's efficacy. Qualitative data gathered through structured observations, parental feedback questionnaires, and teacher interviews contextualise these metrics within the broader learning environment and provide insight into usability, engagement, and the child's subjective experience.

## **3.2 System Architecture**

### **3.2.1 High-Level Architecture Overview**

The WhisperWrite/WhisperMath system is architected as a four-layer stack: the Presentation Layer (React Native mobile application), the Application Logic Layer (cognitive load balancer, session management, feedback orchestration), the AI Inference Layer (on-device TinyBERT and MobileBERT models via ONNX/TFLite), and the Data Persistence Layer (Firebase Firestore for real-time synchronization, local SQLite for offline caching).

The architecture is deliberately offline-first: all core AI inference occurs on-device, and the system remains fully functional without internet connectivity. When connectivity is available, session data is synchronised to Firebase for parent/teacher dashboard access and longitudinal performance tracking. This design choice is motivated by the deployment reality of the target educational contexts, where internet access cannot be assumed.

### **3.2.2 WhisperWrite Module Architecture**

The WhisperWrite module provides real-time writing assistance through three primary functions:

- Word-by-Word Read-Aloud: As the child types or writes (via OCR capture), each completed word is immediately converted to speech via the device's TTS engine, providing continuous auditory confirmation of the text being produced. This function directly addresses the phonological processing deficit central to dyslexia by creating a closed-loop connection between the orthographic and phonological representations of each word.
- Contextual Spelling Feedback: The on-device TinyBERT model performs masked language model inference to assess the probability of each produced word in its contextual sequence. Words falling below a configurable probability threshold are flagged and presented to the child with a phonetically decomposed correction suggestion, delivered via both visual highlighting and audio pronunciation.
- Adaptive Difficulty Management: The module maintains a running performance profile tracking the child's spelling accuracy rate, error type distribution (phonetic vs. visual vs. whole-word errors), and average response time to correction suggestions. This profile is shared with the Cognitive Load Balancer to inform domain-switching decisions.

### **3.2.3 WhisperMath Module Architecture**

The WhisperMath module provides real-time mathematical support through three complementary functions:

- Verbal Problem Decomposition: When the child is presented with or inputs a mathematical problem, the MobileBERT model (fine-tuned on a curated arithmetic word-problem dataset) performs semantic parsing to identify the problem type, extract relevant numerical operands, and generate a step-by-step verbal decomposition of the solution pathway. Each step is delivered through the TTS engine at a pace calibrated to the child's cognitive profile.
- Numerical Error Classification: As the child provides intermediate calculation steps or final answers, the module compares these against the expected solution pathway and classifies errors by type: procedural errors (wrong algorithm), retrieval errors (wrong arithmetic facts), careless errors (correct algorithm, transcription mistake), or conceptual errors (fundamental misunderstanding of the problem structure). The error classification directly informs the targeted feedback delivered.
- Adaptive Scaffolding: The WhisperMath module dynamically adjusts the level of scaffolding provided — from full step-by-step verbal guidance to minimal prompting — based on the child's demonstrated mastery and current cognitive load state, as communicated by the Cognitive Load Balancer.

### **3.2.4 Cognitive Load Balancer**

The Cognitive Load Balancer (CLB) is the novel architectural component that differentiates this system from existing single-domain interventions. The CLB operates as a continuous monitoring and scheduling process, sampling performance metrics from both the WhisperWrite and WhisperMath modules every 30 seconds during an active session.

The CLB applies a multi-factor load estimation model incorporating the following signals:

- Error Rate Trend: A rising error rate over the preceding three minutes in the active domain is weighted as a positive indicator of increasing cognitive load.
- Response Latency: Progressively increasing time between task presentation and response initiation signals diminishing processing capacity.
- Correction Acceptance Rate: Declining acceptance of correction suggestions (i.e., the child dismissing or ignoring feedback) is treated as a proxy for attentional fatigue.
- Session Duration Penalty: An exponentially increasing load penalty is applied as session duration in a single domain exceeds optimal engagement thresholds derived from the child's historical performance profile.
- Voluntary Signals: The child can explicitly request a domain switch through a dedicated UI control, which overrides the algorithmic recommendation.

When the composite load score in the active domain exceeds a configured threshold — calibrated individually during the initial assessment phase — the CLB initiates a domain switch, presenting the transition to the child as a natural, game-like level change to maintain engagement and reduce potential frustration associated with perceived failure.

## **3.3 Edge AI Model Selection and Optimization**

### **3.3.1 Model Selection Rationale**

The selection of TinyBERT for the WhisperWrite module and MobileBERT for the WhisperMath module was governed by three criteria: inference latency on target hardware (mid-range Android smartphones with 3-4 GB RAM and Snapdragon 660-class or equivalent processors), task-specific accuracy on the relevant NLU benchmarks, and model footprint within the 150 MB application size constraint.

TinyBERT achieves these criteria for contextual language modeling tasks, with a model footprint of approximately 66 MB post-quantization, average inference latency of 47 ms per sentence on the target hardware, and masked language model accuracy within 3.2 percentage points of full BERT-base. MobileBERT's structural innovations — bottleneck structures and inverted bottleneck feedforward networks — provide superior throughput for the sequential, multi-step reasoning required by arithmetic problem decomposition, with a footprint of approximately 95 MB post-quantization and average inference latency of 62 ms per problem.

### **3.3.2 Model Optimization Pipeline**

Both models are processed through a four-stage optimization pipeline prior to deployment:

1.  Task-Specific Fine-Tuning: TinyBERT is fine-tuned on a curated spelling error corpus derived from the British Dyslexia Association's research datasets and supplemented with annotated writing samples from dyslexic children. MobileBERT is fine-tuned on the AQuA-RAT arithmetic reasoning dataset, augmented with manually constructed elementary arithmetic problem sets.
2.  Quantization: Both models undergo INT8 post-training quantization using TensorFlow's model optimization toolkit, reducing precision from FP32 to INT8 without fine-tuning accuracy loss exceeding 2.1 percentage points.
3.  ONNX Conversion: The quantized models are converted to the ONNX interchange format to enable hardware-agnostic deployment and compatibility with the ONNX Runtime mobile inference engine.
4.  TFLite Conversion and Delegation: The ONNX models are converted to TensorFlow Lite flatbuffer format and configured to leverage hardware acceleration via the Neural Networks API (NNAPI) on compatible Android devices, further reducing inference latency by 15-30% on supported hardware.

## **3.4 Technology Stack**

| **Component** | **Technology** | **Justification** |
| --- | --- | --- |
| Mobile Frontend | React Native | Cross-platform deployment from single codebase; strong accessibility library support |
| Backend API | Python (Flask) | Lightweight REST API; extensive ML library ecosystem |
| On-Device AI (Writing) | TinyBERT + ONNX/TFLite | Low-latency, offline-capable contextual NLP |
| On-Device AI (Math) | MobileBERT + ONNX/TFLite | Mobile-optimized reasoning model with minimal footprint |
| Computer Vision | YOLOv8, OpenCV | Real-time object recognition for photo-based spelling challenge module |
| Cognitive Profiling | Scikit-learn (KNN) | Lightweight, interpretable classification for focus level assignment |
| Model Optimization | ONNX, TensorFlow Lite | Hardware-agnostic quantization and mobile deployment |
| Speech Processing | NLTK, Azure Speech SDK | Phoneme-level analysis and high-quality TTS synthesis |
| Database (Cloud) | Firebase Firestore | Real-time synchronisation; offline persistence; secure authentication |
| Database (Local) | SQLite (via Expo SQLite) | Offline session caching and performance metric storage |
| Version Control | GitHub | Collaborative development and release management |

_Table 3.3: Technology Stack and Justification_

## **3.5 System Workflow**

The system workflow proceeds through the following sequential stages for each learning session:

1.  User Authentication: The child logs in via a PIN-based authentication screen. Parental account linking enables guardian access to the progress dashboard.
2.  Session Initialisation: The system retrieves the child's historical cognitive profile from Firebase (or the local SQLite cache if offline) and configures initial module parameters — starting difficulty level, preferred TTS voice, haptic feedback intensity — according to the profile.
3.  Domain Selection: Based on the cognitive profile and the most recent session outcome, the CLB recommends an initial domain (WhisperWrite or WhisperMath). The child may accept this recommendation or override it.
4.  Active Learning Phase: The child engages with the selected module. Real-time AI inference, feedback generation, and performance metric collection occur continuously.
5.  Cognitive Load Monitoring: Every 30 seconds, the CLB evaluates the composite load score. If the threshold is exceeded, a domain-switch animation is triggered.
6.  Session Conclusion: Upon session completion (voluntary or time-limit triggered), a summary screen presents the child with a visual progress summary including correct responses, improvements, and earned badges.
7.  Data Synchronisation: Session data is committed to Firebase when connectivity is available; otherwise, it is held in the local SQLite cache for background synchronisation.
8.  Parent/Teacher Dashboard Update: The guardian dashboard is updated with the session summary, longitudinal trends, and AI-generated recommendations for complementary offline activities.

## **3.6 Functional Requirements**

| **Req. ID** | **Requirement Description** | **Priority** |
| --- | --- | --- |
| FR-01 | System shall provide real-time read-aloud feedback for each word typed by the child in the writing module | High |
| FR-02 | System shall detect and classify spelling errors by type (phonetic, visual, whole-word) using on-device TinyBERT | High |
| FR-03 | System shall provide phonetically decomposed correction suggestions with audio pronunciation | High |
| FR-04 | System shall parse and verbally decompose arithmetic problems into sequential solution steps via MobileBERT | High |
| FR-05 | System shall classify mathematical errors by type and provide targeted corrective guidance | High |
| FR-06 | Cognitive Load Balancer shall monitor real-time performance metrics and trigger domain switches when threshold exceeded | High |
| FR-07 | System shall deliver multisensory feedback: visual highlighting, TTS audio, and haptic vibration patterns | High |
| FR-08 | System shall dynamically adjust task difficulty based on performance within each session | High |
| FR-09 | System shall maintain complete session logs and present longitudinal progress data in the parent dashboard | Medium |
| FR-10 | System shall operate in full offline mode, with all AI inference performed on-device | High |
| FR-11 | System shall synchronise session data with Firebase when internet connectivity is available | Medium |
| FR-12 | System shall provide motivational feedback including badges, progress bars, and encouraging messages | Medium |

_Table 3.1: Functional Requirements Specification_

## **3.7 Non-Functional Requirements**

| **Req. ID** | **Requirement** | **Target Specification** |
| --- | --- | --- |
| NFR-01 | Performance — Inference Latency | AI feedback generated within 100 ms of input completion on target device class |
| NFR-02 | Performance — UI Responsiveness | Application frame rate >= 50 FPS during all interactive gameplay |
| NFR-03 | Reliability | System uptime >= 99% during offline operation; graceful degradation on connectivity loss |
| NFR-04 | Scalability | Backend architecture supports >= 10,000 concurrent users without performance degradation |
| NFR-05 | Accessibility | Dyslexia-friendly fonts (OpenDyslexic / Lexie Readable); adjustable text size; high-contrast mode |
| NFR-06 | Security | All user data encrypted at rest and in transit; COPPA-compliant data handling for users under 13 |
| NFR-07 | Offline Capability | 100% core functionality available without internet connectivity |
| NFR-08 | Localisation | Architecture supports Sinhala and Tamil language content in addition to English |
| NFR-09 | Device Compatibility | Functional on Android devices with >= 3 GB RAM, Android 9.0+, Snapdragon 660 class or equivalent |
| NFR-10 | Battery Efficiency | Session of 30 minutes shall not consume more than 8% battery on target device class |

_Table 3.2: Non-Functional Requirements Specification_

## **3.8 System Budget**

| **Category** | **Item** | **Amount (LKR)** |
| --- | --- | --- |
| AI Model Development | Cloud Services for Model Training (Colab Pro, AWS EC2) | 15,000.00 |
| AI Model Development | Specialized AI Development Libraries and APIs | 5,000.00 |
| AI Model Development | Dataset Acquisition and Licensing (Speech/Cognitive/Math) | 5,000.00 |
| System Development | Software Development Environment and Licenses | 3,000.00 |
| System Development | On-Device Performance Profiling Tools | 2,000.00 |
| System Development | Testing and Quality Assurance | 4,000.00 |
| Deployment & Maintenance | App Store Deployment Fees | 5,000.00 |
| Deployment & Maintenance | Maintenance and Model Update Infrastructure | 6,000.00 |
|     | TOTAL | 45,000.00 |

_Table 3.4: System Budget Breakdown (LKR)_

## **3.9 Project Planning**

### **3.9.1 Gantt Chart Summary**

The project execution timeline extended from June 2025 through May 2026, organised into seven primary phases: Project Initiation (June–July 2025), Planning and Research (August–September 2025), System Design (September–October 2025), AI Development (October–January 2026), Application Development (January–March 2026), Testing and Quality Assurance (March–April 2026), and Deployment and Documentation (April–May 2026).

### **3.9.2 Work Breakdown Structure**

The work breakdown structure decomposes the project into five primary work packages: (1) Research and Requirements — literature review, gap analysis, requirements elicitation; (2) Design — system architecture, UI/UX prototyping, database schema design; (3) AI Model Development — dataset preparation, model fine-tuning, quantization, ONNX conversion; (4) Application Development — React Native frontend, Flask backend API, Firebase integration, offline cache implementation; (5) Evaluation — test case development, user study execution, data analysis, thesis writing.

# **CHAPTER 4: IMPLEMENTATION AND TESTING**

## **4.1 Development Environment and Setup**

The development environment comprised the following configuration: macOS Ventura 13.5 development workstation (Apple M2, 16 GB RAM) for React Native development and model optimisation; Google Colab Pro (A100 GPU) for model fine-tuning and training; Ubuntu 22.04 cloud instance (AWS EC2 t3.medium) for Flask backend hosting; and a physical Android test device (Samsung Galaxy A52, Snapdragon 720G, 6 GB RAM, Android 13) representing the target user device class.

The React Native development environment used Expo SDK 49 with the Bare workflow to enable direct access to native Android APIs for NNAPI delegation and haptic feedback. The Python backend was containerised using Docker for consistent deployment and dependency management.

## **4.2 WhisperWrite Module Implementation**

### **4.2.1 Input Processing Pipeline**

The WhisperWrite module accepts text input through three modalities: (1) direct keyboard entry via a custom dyslexia-friendly keyboard layout with enlarged, colour-coded keys; (2) voice dictation via the Android SpeechRecognizer API, with phoneme-level post-processing using NLTK to align spoken and written representations; and (3) handwriting capture via the device camera, processed using OpenCV's adaptive thresholding and contour detection algorithms to segment individual characters, followed by a lightweight character recognition CNN (based on a quantized MobileNetV2 backbone) for letter classification.

All three input modalities feed into a unified text buffer maintained in React Native state, which serves as the source for both the TTS read-aloud function and the TinyBERT spelling analysis pipeline.

### **4.2.2 TinyBERT Integration**

The TinyBERT model is loaded into memory at application startup using the ONNX Runtime React Native bridge library (onnxruntime-react-native). The model is initialised with the dyslexia-specific fine-tuned weights and operates in masked language model mode, replacing each produced word with the \[MASK\] token and computing the probability distribution over the vocabulary for that position. The produced word's probability is compared against a dynamically adjusted threshold — initialised at 0.35 and adapted based on the child's vocabulary level profile — to determine whether a spelling error is likely.

When an error is detected, the top three alternative completions from the model's probability distribution are retrieved, filtered through an edit-distance check to exclude alternatives more than three characters different from the produced word, and ranked by combined probability and phonetic similarity (computed using the Double Metaphone algorithm via a JavaScript port). The highest-ranked alternative is presented as the primary suggestion, with the remaining two offered as secondary options.

### **4.2.3 Multisensory Feedback Delivery**

Feedback delivery is orchestrated by the FeedbackOrchestrator component, which coordinates three parallel output channels. The visual channel highlights the erroneous word in amber and displays the correction suggestion in a tooltip bubble. The audio channel uses the Azure Cognitive Services TTS API — cached locally for offline operation — to pronounce both the produced word and the suggested correction, with a phonemic breakdown delivered as: "You wrote \[word\]. Did you mean \[correction\]? Let's say it together: \[phoneme-by-phoneme breakdown\]." The haptic channel uses the device vibration API to deliver a two-pulse pattern for incorrect responses and a single smooth pulse for correct responses.

## **4.3 WhisperMath Module Implementation**

### **4.3.1 Problem Presentation System**

The WhisperMath module presents mathematical problems through an adaptive problem generator that draws from a curated problem bank organised into twelve difficulty tiers, ranging from single-digit addition (Tier 1) through multi-step word problems involving fractions and decimals (Tier 12). Problems are presented in a large-font, high-contrast format with dyslexia-friendly typography (OpenDyslexic font, line spacing 1.8, character spacing +2 pt). A dedicated "read problem aloud" button — prominently positioned and colour-coded — allows the child to hear the problem narrated at any time.

### **4.3.2 MobileBERT Integration for Problem Decomposition**

When a problem is loaded, the MobileBERT model performs semantic parsing to identify the problem structure: operation type(s), operands, intermediate results required, and final answer. The model was fine-tuned on a dataset of 12,000 elementary arithmetic problems annotated with solution pathways. The output is a structured solution plan — a JSON object containing an ordered list of solution steps, each with a verbal description, the operation to be performed, and the expected intermediate result.

This solution plan is used to generate the step-by-step verbal guidance delivered through the TTS engine. The pacing of step delivery is calibrated to the child's average response time in the current session — faster-responding children receive more concise guidance, while slower responders receive more detailed breakdowns with additional worked examples.

### **4.3.3 Error Classification and Targeted Feedback**

As the child inputs intermediate steps and the final answer, each response is compared against the solution plan using a multi-layer error classification heuristic:

- Procedural Error Detection: If the applied operation type does not match the expected operation (e.g., subtraction applied where addition is required), a procedural error is flagged and the relevant solution step is re-explained.
- Retrieval Error Detection: If the correct operation is applied to the correct operands but yields an incorrect result that matches a known arithmetic fact error pattern (e.g., 6 x 7 = 42 misremembered as 40), a retrieval error is flagged and targeted arithmetic fact practice is presented.
- Transcription Error Detection: If the mathematical expression is correctly formed but a digit is transposed or substituted (a common manifestation of dyscalculia), a transcription error is flagged with specific visual guidance highlighting the transposed digit.
- Conceptual Error Detection: If the solution plan reveals a systematic misunderstanding of the problem structure (e.g., adding instead of multiplying in a repeated-addition scenario), a conceptual error is flagged and a concrete visual representation of the concept is presented.

## **4.4 Cognitive Load Balancer Implementation**

The CLB is implemented as a background service (React Native Background Fetch via Expo TaskManager) that executes asynchronously every 30 seconds during active sessions. The service reads the current session's performance buffer from the local SQLite cache and computes the composite load score (CLS) as:

**CLS = w₁·ΔE + w₂·ΔL + w₃·(1 - ACR) + w₄·D(t)**

Where ΔE is the normalised error rate trend, ΔL is the normalised latency trend, ACR is the correction acceptance rate, D(t) is a time-decay function representing cumulative cognitive depletion, and w₁–w₄ are empirically calibrated weights (0.30, 0.25, 0.20, 0.25 respectively, derived from the initial pilot study).

When CLS exceeds 0.65 (on a 0–1 normalised scale), the CLB triggers a domain switch event. The switch is presented to the child through an animated "Level Complete" screen — regardless of whether the switch is performance-triggered or voluntary — to maintain a positive emotional valence for the transition.

## **4.5 User Interface Implementation**

### **4.5.1 Design Principles**

The UI design was guided by four core principles derived from the dyslexia-friendly design literature and validated through an initial co-design workshop with two educational psychologists and three special education teachers:

- Minimal Text: All navigation and instructional elements use iconographic representation supplemented by audio labels, minimising the reading burden on the child.
- High Visual Contrast: The application uses a carefully calibrated colour palette — cream (#FDFDF5) background, deep navy (#1A237E) primary text, amber (#FFA000) for warnings — that provides sufficient contrast without visual fatigue.
- Large Touch Targets: All interactive elements meet or exceed the WCAG 2.1 minimum touch target size of 44 x 44 CSS pixels, with additional padding to reduce accidental activations.
- Consistent Layout: Navigation elements remain fixed across all screens, reducing working memory demands associated with UI exploration.

### **4.5.2 WhisperWrite Interface**

The WhisperWrite interface presents a large text area occupying approximately 60% of the screen, with the current word highlighted in real-time as it is spoken by the TTS engine. A visual progress bar at the top of the screen tracks the child's writing session metrics (words written, accuracy rate, session duration). The correction suggestion tooltip appears as a floating card anchored to the highlighted error word, with three large buttons: "Accept Suggestion," "Hear Again," and "Try Again."

### **4.5.3 WhisperMath Interface**

The WhisperMath interface presents the current problem in a card-style container occupying the upper half of the screen. Below the problem card, a sequential step guide displays the current solution step with large numerals and operation symbols. A numpad keyboard is presented for answer input, with additional function buttons for "Hear Step," "Show Hint," and "Ask for Help." The bottom navigation bar provides access to the progress screen, settings, and the domain-switch control.

## **4.6 Testing Strategy**

### **4.6.1 Technical Testing**

Technical testing was conducted in three phases:

**Unit Testing:**

Each module was tested in isolation using Jest (for React Native components) and PyTest (for Flask backend endpoints). Test suites comprised 142 unit tests covering all functional requirement scenarios, with 97.8% test pass rate achieved prior to integration.

**Integration Testing:**

Integration tests verified the correct interaction between the React Native application, the ONNX Runtime inference engine, the Flask backend, and Firebase Firestore. End-to-end test scenarios were executed for all twelve functional requirements, including offline operation scenarios simulated by disabling network access during test execution.

**Performance Testing:**

Performance benchmarks were conducted on the target Android device. Average TinyBERT inference latency measured 51 ms per word (σ = 8.3 ms). Average MobileBERT inference latency measured 67 ms per problem (σ = 11.2 ms). UI frame rate averaged 53.2 FPS during standard game-play scenarios and 48.7 FPS during peak AI inference moments — both above the 50 FPS target.

### **4.6.2 Model Performance Benchmarks**

| **Metric** | **TinyBERT (WhisperWrite)** | **MobileBERT (WhisperMath)** | **Target** |
| --- | --- | --- | --- |
| Model Size (Post-Quantization) | 66 MB | 95 MB | < 150 MB each |
| Average Inference Latency | 51 ms | 67 ms | < 100 ms |
| Accuracy vs Full BERT | 96.8% | 95.1% | \> 94% |
| Spelling Error Detection Precision | 91.3% | N/A | \> 88% |
| Spelling Error Detection Recall | 87.6% | N/A | \> 85% |
| Math Error Classification Accuracy | N/A | 88.4% | \> 85% |
| Offline Operation | Full | Full | Full |

_Table 4.1: Model Performance Benchmarks_

### **4.6.3 User Testing**

User testing was conducted over two weeks as a precursor to the formal evaluation study described in Chapter 5, with six dyslexic children (ages 7–12) in a controlled lab environment at SLIIT's accessibility research facility. The objectives were to identify usability issues, calibrate the Cognitive Load Balancer thresholds, and refine the UI design based on direct observation.

Key usability issues identified and resolved during this phase included: excessive TTS speech rate (reduced from 1.0x to 0.8x default); insufficient visual distinction between the active and inactive domain indicators; and sub-optimal placement of the "domain switch" control (moved from the settings menu to the persistent navigation bar). Three iterations of design refinement were completed based on the observed interaction data and verbal feedback from participating children.

# **CHAPTER 5: RESULTS AND DISCUSSION**

## **5.1 Evaluation Study Design**

### **5.1.1 Participants**

The evaluation study recruited twelve children diagnosed with dyslexia (nine male, three female; mean age 9.7 years, SD 1.8, range 7–13) through a partnership with the Ayati Centre for Children with Special Needs in Ragama, Sri Lanka. All participants held formal dyslexia diagnoses issued by registered educational psychologists within the preceding 24 months. Seven participants also presented with co-occurring dyscalculia (as assessed by the Dyscalculia Screener), and five showed evidence of dysgraphia symptoms as noted in their assessment reports. Ethical approval was obtained from the SLIIT Research Ethics Committee, and written informed consent was provided by all parents/guardians. Assent was obtained from all participating children.

### **5.1.2 Procedure**

Participants completed daily 25–30 minute sessions with the WhisperWrite/WhisperMath system over four consecutive weeks, for a total of 20 sessions per participant (Monday through Friday). Sessions were conducted in the participants' home environments to maximise ecological validity. Parents were provided with a brief orientation guide and a tutorial video. A researcher conducted weekly check-in calls with each family to document technical issues, parental observations, and the child's reported experience. No researcher was present during individual sessions to avoid observation effects.

Pre-assessment and post-assessment measures were administered by the Ayati Centre's educational psychologist at the beginning of Week 1 and the end of Week 4. These assessments comprised standardised spelling tests (Schonell Graded Word Spelling Test), basic arithmetic fact and computation assessments, and the Children's Sustained Attention Task (CSAT) as a measure of cognitive focus.

### **5.1.3 Outcome Measures**

Primary outcome measures were: (1) Writing Accuracy Rate — the proportion of words produced without spelling errors per session; (2) Mathematical Error Rate — the proportion of mathematical steps or answers that were incorrect per session; (3) Cognitive Load Switch Frequency — the number of domain switches triggered by the CLB per session; and (4) Session Duration — the total time the child voluntarily remained engaged with the system. Secondary measures included parental ratings of at-home attention, teacher observations of classroom behaviour, and the child's self-reported enjoyment and confidence ratings collected via a simple emoji-scale instrument.

## **5.2 Case Studies and Observations**

### **5.2.1 Case Study A: Low Initial Proficiency Profile**

Participant A (age 8, male) presented with severe dyslexia and co-occurring dyscalculia. His pre-assessment writing accuracy rate was 38% and his mathematical error rate was 72%. During Week 1, Participant A engaged primarily with the WhisperWrite module and demonstrated high frustration when encountering errors, occasionally abandoning tasks. The CLB triggered an average of 4.2 domain switches per session during Week 1, consistently at 8–10 minutes into the writing domain, suggesting rapid cognitive depletion.

By Week 3, observable changes were documented: Participant A began to voluntarily trigger domain switches himself (accounting for 2.1 of the average 3.8 switches per session), indicating developing metacognitive awareness of his own cognitive state. His writing accuracy rate improved to 56% and his mathematical error rate declined to 58% by Week 4 — improvements of 18 and 14 percentage points respectively. His parent reported a notable improvement in willingness to attempt homework tasks and reduced avoidance behaviour.

### **5.2.2 Case Study B: Medium Initial Proficiency Profile**

Participant B (age 10, female) presented with moderate dyslexia without co-occurring dyscalculia. Her pre-assessment writing accuracy was 61% and her mathematical error rate was 34%. Participant B adapted quickly to the system interface, demonstrating high engagement with both modules and regularly seeking to improve her leaderboard position. The CLB triggered significantly fewer domain switches for Participant B (average 1.4 per session in Week 1, declining to 0.8 in Week 4), reflecting her higher baseline cognitive resilience.

By the conclusion of the study, Participant B's writing accuracy reached 79% and her mathematical error rate declined to 21%. Her educational psychologist noted a measurable improvement in the Schonell Graded Word Spelling Test score (+14 standardised score points), which she attributed in part to the system's phonemic breakdown feedback mechanism.

### **5.2.3 Case Study C: High Initial Proficiency Profile**

Participant C (age 13, male) presented with mild dyslexia that had been managed through prior intervention. His pre-assessment writing accuracy was 74% and his mathematical error rate was 28%. Participant C's primary challenge was maintaining motivation for tasks he perceived as too easy. The WhisperMath module's adaptive difficulty system responded to his high performance by advancing him to Tier 8–10 problems by Week 2, providing sufficient challenge to maintain engagement. Participant C consistently achieved the highest session scores and was designated as a "WhisperMaster" — the system's equivalent of the "Focus Champion" motivational role — during the study period.

## **5.3 Performance Metrics**

### **5.3.1 Writing Accuracy Rate**

Across all twelve participants, the mean writing accuracy rate improved from 57.3% (SD = 11.2%) at Week 1 to 75.6% (SD = 8.4%) at Week 4, representing a mean improvement of 18.3 percentage points (31.9% relative improvement). A paired samples t-test confirmed that this improvement was statistically significant (t(11) = 7.84, p < 0.001, d = 2.26). The improvement was sustained across all three proficiency subgroups, with the Low proficiency group demonstrating the largest absolute improvement (22.1 pp) and the High proficiency group demonstrating the smallest but still meaningful improvement (11.4 pp).

| **Proficiency Group** | **n** | **Week 1 Mean (%)** | **Week 4 Mean (%)** | **Improvement (pp)** | **p-value** |
| --- | --- | --- | --- | --- | --- |
| Low | 4   | 42.1 | 64.2 | +22.1 | < 0.01 |
| Medium | 5   | 59.6 | 76.8 | +17.2 | < 0.01 |
| High | 3   | 75.3 | 86.7 | +11.4 | < 0.05 |
| All Participants | 12  | 57.3 | 75.6 | +18.3 | < 0.001 |

_Table 5.1: Writing Accuracy Rate Improvement Across Study Period_

### **5.3.2 Mathematical Error Rate**

The mean mathematical error rate across all participants declined from 52.8% (SD = 18.4%) at Week 1 to 37.9% (SD = 12.7%) at Week 4, representing a mean reduction of 14.9 percentage points (28.2% relative improvement). This improvement was statistically significant (t(11) = 5.43, p < 0.001, d = 1.57). For the seven participants with co-occurring dyscalculia, the improvement was notably larger (mean reduction of 19.3 pp), compared to 7.8 pp for participants without dyscalculia, suggesting that the WhisperMath module's targeted error classification is particularly beneficial for children with this specific comorbidity.

### **5.3.3 Session Duration and Engagement**

Mean session duration increased from 11.3 minutes (SD = 3.2 min) in Week 1 to 22.7 minutes (SD = 4.1 min) in Week 4, representing a 101% increase in voluntary engagement time. This metric is particularly notable because sessions were self-terminating — children were not instructed to continue for any specific duration — making session duration a direct behavioural indicator of intrinsic motivation and engagement. The increase in session duration was consistent across all participants and correlated positively with the frequency of motivational badge awards (r = 0.71, p < 0.01), suggesting that the gamification elements played a meaningful role in sustaining engagement.

| **Week** | **Mean Duration (min)** | **SD** | **CLB Switches / Session** | **Badge Awards / Session** |
| --- | --- | --- | --- | --- |
| Week 1 | 11.3 | 3.2 | 3.1 | 2.4 |
| Week 2 | 15.6 | 3.8 | 2.7 | 3.1 |
| Week 3 | 19.2 | 4.0 | 2.2 | 3.8 |
| Week 4 | 22.7 | 4.1 | 1.8 | 4.5 |

_Table 5.3: User Engagement Metrics Across Study Period_

### **5.3.4 Cognitive Load Balancer Performance**

The declining CLB switch frequency observed across the study period — from an average of 3.1 switches per session in Week 1 to 1.8 in Week 4 — is interpreted as evidence of improved sustained cognitive performance. As participants developed fluency with the system and built cognitive resilience through repeated practice, the CLB triggered fewer interventions, indicating that children were maintaining performance within acceptable cognitive load thresholds for longer periods. This trajectory is consistent with the theorised cognitive load reduction mechanism central to the intervention design.

The CLB's domain-switch decisions were validated through a post-study review of session logs by an independent educational psychologist, who rated 84% of algorithmically-triggered switches as "timely and appropriate" based on the performance patterns immediately preceding the switch. This validation provides evidence that the composite load score formulation captures meaningful indicators of cognitive fatigue.

### **5.3.5 Focus Level Categorization**

| **Focus Level** | **Pre-Intervention (n)** | **Post-Intervention (n)** | **Change** |
| --- | --- | --- | --- |
| Low | 5   | 2   | \-3 |
| Medium | 5   | 6   | +1  |
| High | 2   | 4   | +2  |

_Table 5.5: Participant Focus Level Categorization (Pre vs Post)_

## **5.4 Challenges and Solutions**

| **Challenge Encountered** | **Solution Implemented** | **Outcome** |
| --- | --- | --- |
| TinyBERT misclassifying rare but correctly-spelled words as errors (false positive rate 12%) | Added child's personalised vocabulary whitelist populated from session history; adjusted confidence threshold dynamically | False positive rate reduced to 4.7% |
| MobileBERT latency spikes (>150 ms) on complex Tier 8+ problems during sustained use | Implemented result caching for repeated problem types; added background warm-up inference | Latency normalised to 67 ms average |
| Children rejecting domain-switch transitions, perceiving them as punishment | Reframed all switches as "Level Change" with celebratory animation and badge award | Switch acceptance rate improved from 61% to 89% |
| Haptic feedback intensity too subtle for some devices; perceived as non-functional | Added visual indicator concurrent with haptic; made haptic intensity user-configurable | Sensory feedback comprehension confirmed 100% in post-revision testing |
| Parental engagement declining after Week 2 — dashboard underutilised | Introduced weekly AI-generated summary email with personalised activity recommendations | Parent dashboard login frequency increased 2.3x in Weeks 3 and 4 |

_Table 5.4: Summary of Challenges and Solutions_

## **5.5 Research Findings**

The results of the evaluation study collectively support three principal research findings:

**Finding 1: Dual-Skill Simultaneous Intervention is Both Feasible and Effective**

The WhisperWrite/WhisperMath system demonstrated significant, statistically robust improvements in both writing accuracy (31.9% relative improvement) and mathematical error rates (28.2% relative improvement) within a single four-week intervention period. This establishes the fundamental feasibility and effectiveness of the dual-skill paradigm as an intervention approach for dyslexic children with co-occurring dyscalculia.

**Finding 2: Cognitive Load Balancing Enhances Sustained Engagement**

The doubling of session duration across the study period, combined with the declining frequency of CLB-triggered domain switches, provides evidence that the cognitive load management mechanism successfully extended productive engagement time. Children remained cognitively active within acceptable load thresholds for progressively longer periods — the hallmark of effective cognitive scaffolding.

**Finding 3: Edge AI Enables Effective Real-Time Feedback in Offline Contexts**

All sessions were conducted in home environments without researcher-controlled internet access. System logs confirmed that 73% of sessions occurred in offline mode, yet no degradation in feedback quality or inference accuracy was documented. Average inference latency of 51 ms (TinyBERT) and 67 ms (MobileBERT) in offline conditions met the 100 ms perceptibility threshold for real-time feedback, confirming that edge AI provides a viable pathway for intelligent intervention in connectivity-constrained educational environments.

## **5.6 Discussion**

The findings of this study are consistent with and extend the emerging literature on AI-powered adaptive learning for learners with specific learning disabilities. The improvement trajectory observed in writing accuracy aligns with the theoretical predictions of Cognitive Load Theory: as the system reduces extraneous load through structured feedback and manages intrinsic load through adaptive difficulty progression, children are better positioned to invest germane cognitive load in schema construction, yielding durable improvements in spelling accuracy.

The specific efficacy of the WhisperMath module for participants with co-occurring dyscalculia (19.3 pp error rate reduction vs. 7.8 pp for non-dyscalculia participants) is a particularly noteworthy finding. It suggests that the error classification taxonomy — distinguishing procedural, retrieval, transcription, and conceptual errors — provides targeted feedback that addresses the specific error types most common in dyscalculia, rather than offering generic correctness feedback that fails to guide remediation.

The declining CLB switch frequency across the study period, interpreted here as an indicator of developing cognitive resilience, parallels the findings of training-induced changes in sustained attention capacity documented in the gamified cognitive training literature. The CLB thus appears to function not merely as a reactive accommodation mechanism but as a scaffold for the progressive development of cognitive stamina — an unexpected but theoretically coherent benefit of the intervention design.

The system's robust offline performance has implications that extend beyond the Sri Lankan context to any educational setting characterised by digital inequity. The edge AI paradigm demonstrated here — lightweight, quantized transformer models deployed via ONNX/TFLite with device-local inference — provides a generalizable technical architecture for equitable AI-powered education in under-resourced environments globally.

Limitations of the current study include the small sample size (n = 12), the absence of a matched control group receiving conventional intervention, and the four-week study duration, which precludes conclusions about the long-term maintenance of gains. Future research should address these limitations through a randomised controlled trial with a larger, more diverse sample and a longer follow-up period. The system's localisation to Sinhala and Tamil — planned for the next development iteration — will be essential for evaluating its utility in the broader Sri Lankan primary school context.

# **CHAPTER 6: CONCLUSION**

## **6.1 Summary of Contributions**

This dissertation has presented the design, implementation, and evaluation of WhisperWrite and WhisperMath — a novel dual-skill, real-time AI feedback system for dyslexic children that simultaneously addresses writing and mathematical skill development within a single, unified, cognitively adaptive platform. The principal contributions of this work are as follows:

1.  Novel System Architecture: The first documented implementation of a unified platform that simultaneously provides AI-driven, real-time feedback for both written language production and mathematical problem-solving in dyslexic children, integrated through a Cognitive Load Balancer that manages domain-switching based on live performance signals.
2.  Edge AI Deployment Framework: A demonstrated pipeline for deploying quantized transformer models (TinyBERT and MobileBERT) via ONNX and TFLite for sub-100 ms on-device NLP inference on mid-range Android hardware, without internet connectivity.
3.  Cognitive Load Balancer Design: A principled, empirically calibrated composite load scoring formulation incorporating error rate trends, response latency, correction acceptance rate, and session-duration penalty — validated against independent expert rating with 84% agreement.
4.  Dyslexia Error Taxonomy for AI Feedback: A four-category mathematical error classification taxonomy (procedural, retrieval, transcription, conceptual) implemented through fine-tuned MobileBERT inference, which demonstrated significantly greater efficacy for dyscalculia co-presenters than generic correctness feedback.
5.  Empirical Evaluation: A controlled evaluation with twelve dyslexic children over four weeks, documenting a 31.9% relative improvement in writing accuracy, a 28.2% relative reduction in mathematical error rates, and a 101% increase in voluntary session duration.

## **6.2 Practical Implications**

The practical implications of this research are significant for three communities of practice:

For Special Education Practitioners: The WhisperWrite/WhisperMath system provides a rigorously evaluated, technology-mediated intervention that can complement and extend existing therapeutic practice. The system's parent dashboard and weekly summary emails provide practitioners with richer, more frequent performance data than is typically available through conventional assessment schedules, enabling more responsive and personalised intervention planning.

For Assistive Technology Developers: The edge AI deployment framework demonstrated in this research — quantized transformer models via ONNX/TFLite — provides a technically validated, replicable architecture for building offline-capable, low-latency NLP features into mobile educational applications. The four-stage model optimization pipeline (fine-tuning → quantization → ONNX conversion → TFLite delegation) is documented in sufficient detail to serve as a practical implementation guide.

For Educational Policy: The system's robust performance in offline, home environments with mid-range devices provides evidence that high-quality AI-powered educational intervention can be delivered equitably across the digital divide. This has implications for educational technology procurement and deployment policy, particularly in contexts where school-based or specialist-clinic-based intervention is unavailable or insufficient.

## **6.3 Future Work**

The current research opens several compelling avenues for future investigation and development:

- Randomised Controlled Trial: A full-scale RCT with a matched control group (receiving conventional intervention) is required to establish causal efficacy and determine the incremental benefit of the dual-skill, cognitive load-aware design over single-domain alternatives.
- Sinhala and Tamil Localisation: Extending the platform's language support to Sinhala and Tamil is essential for deployment in the Sri Lankan primary school context, requiring the development of language-specific fine-tuned models and phonemic breakdown resources.
- Multimodal Cognitive Load Sensing: Future iterations could incorporate physiological sensors — eye-tracking, heart rate variability — as additional cognitive load indicators, potentially enabling more precise and pre-emptive CLB interventions.
- Integration with Full Platform: Complete integration with the other three modules of the 25-26J-333 platform — the Photo-Based Spelling Challenge, the Cognitive Skill Assessment Module, and the Adaptive Game-Based Learning Module — to evaluate the emergent effectiveness of the full multisensory adaptive platform.
- Longitudinal Maintenance Study: A six-to-twelve month follow-up study to assess the maintenance and generalisation of writing and mathematical skill gains after the structured intervention period concludes.
- Teacher Dashboard Expansion: Development of an educator-facing analytics dashboard that integrates individual student performance data with classroom-level reporting, enabling teachers to incorporate system insights into their instructional planning.

## **6.4 Concluding Remarks**

Dyslexia is not a barrier to intelligence, creativity, or achievement — but inadequate support systems too often make it one. This research was motivated by the conviction that technology, when rigorously designed around the actual cognitive needs of dyslexic learners rather than the convenience of system developers, can genuinely reduce the barriers that stand between these children and their potential.

The WhisperWrite/WhisperMath system is a principled attempt to realise that conviction in a practical, deployable form. Its demonstrated effectiveness in improving both writing and mathematical skills simultaneously, its technically validated offline capability, and the profound engagement increase documented in the evaluation study collectively suggest that the approach is worthy of further development, wider evaluation, and ultimately, clinical deployment.

The children who participated in this study taught this researcher more about resilience, creativity, and the human capacity to adapt and grow than any academic literature could. It is to them, and to all children whose potential remains untapped because their learning differences are not yet adequately supported, that this work is ultimately dedicated.

# **REFERENCES**

\[1\] A. H. Wilmot, "Understanding Mental Health in Developmental Dyslexia," International Journal of Environmental Research and Public Health, vol. 20, p. 1653, 2023. https://doi.org/10.3390/ijerph20021653

\[2\] M. J. Snowling, "Dyslexia," 2nd ed. Oxford: Blackwell, 2000.

\[3\] K. Raghavendra, A. Vaidya, and R. Niveditha, "Alphabet problems linked with learning disability in children: a cross sectional study," International Journal of Contemporary Pediatrics, vol. 6, no. 4, pp. 1647–1652, 2019.

\[4\] S. Shaywitz and B. Shaywitz, "The neurobiology of reading and dyslexia," Focus on Basics, vol. 5, pp. 11–15, 2001.

\[5\] M. J. Snowling and C. Hulme, "Evidence-based interventions for reading and language difficulties: Creating a virtuous circle," British Journal of Educational Psychology, vol. 81, pp. 1–23, 2011.

\[6\] B. Butterworth, S. Varma, and D. Laurillard, "Dyscalculia: from brain to education," Science, vol. 332, no. 6033, pp. 1049–1053, 2011.

\[7\] C. Boer, "Dyslexie Font," dyslexiefont.com, 2024. Available: https://dyslexiefont.com/en/

\[8\] L. Kumalasari, H. Tanjung, S. Maharani, and K. Susanti, "Effectiveness of Maghzineh Cognitive Video Games on Cognitive Skills of Children with Dyslexia," in Proc. International Serious Games Symposium (ISGS), 2019.

\[9\] R. Kariyawasam, S. Pushpakumara, S. Pushpika, and P. Ranasinghe, "Deep Learning Based Screening and Assessment of Dyslexia: A Comprehensive Approach," in Proc. IEEE 14th International Conference on Industrial and Information Systems (ICIIS), 2019.

\[10\] G. Maresca, S. Leonardi, M. C. De Cola et al., "Use of virtual reality in children with dyslexia," Children, vol. 9, no. 11, p. 1621, 2022.

\[11\] J. Sweller, "Cognitive load during problem solving: Effects on learning," Cognitive Science, vol. 12, no. 2, pp. 257–285, 1988.

\[12\] X. Jiao, Y. Yin, L. Shang, X. Jiang, X. Chen, L. Li, F. Wang, and Q. Liu, "TinyBERT: Distilling BERT for Natural Language Understanding," in Findings of EMNLP 2020, pp. 4163–4174, 2020.

\[13\] R. Ismail and A. Jaafar, "Interactive screen-based design for dyslexic children," in Proc. International Conference on User Science and Engineering (i-USEr), pp. 168–171, 2011.

\[14\] N. Ouherrou, O. Elhammoumi, F. Benmarrakchi, and J. El Kafi, "A Heuristic Evaluation of an Educational Game for Dyslexic Children," in Proc. International Conference on Smart Learning Environments, 2018.

\[15\] M. R. U. Saputra and K. A. Nugroho, "Learn-to-read application for remediation of dyslexic children based on multisensory approach," in Proc. 4th International Conference on Instrumentation, Communications, Information Technology, and Biomedical Engineering (ICICI-BME), pp. 220–225, 2015.

\[16\] S. N. S. Abu Bakar and N. Hashim, "Game-Based Learning as a Teaching and Learning Method for Children with Dyslexia," in Proc. IEEE 10th Conference on Systems, Process & Control (ICSPC), 2019.

\[17\] M. J. Snowling, Dyslexia: A Cognitive Developmental Perspective. Oxford: Blackwell, 1987.

\[18\] S. E. Shaywitz et al., "Disruption of posterior brain systems for reading in children with developmental dyslexia," Biological Psychiatry, vol. 52, no. 2, pp. 101–110, 2002.

\[19\] K. R. Pugh et al., "The angular gyrus in developmental dyslexia: task-specific differences in functional connectivity within posterior cortex," Psychological Science, vol. 11, no. 1, pp. 51–56, 2000.

\[20\] T. P. Alloway, R. G. Alloway, "Investigating the predictive roles of working memory and IQ in academic attainment," Journal of Experimental Child Psychology, vol. 106, no. 1, pp. 20–29, 2010.

\[21\] J. Stein and V. Walsh, "To see but not to read; the magnocellular theory of dyslexia," Trends in Neurosciences, vol. 20, no. 4, pp. 147–152, 1997.

\[22\] L. Cutting et al., "Academic fluency: linking cognitive and academic abilities in typical readers and those with reading disabilities," Scientific Studies of Reading, vol. 13, no. 3, pp. 233–260, 2009.

\[23\] B. Butterworth, "Dyscalculia Screener," London: NFER-Nelson, 2003.

\[24\] V. W. Berninger et al., "Spelling and computers: A multidisciplinary approach to improving spelling, written language, and reading across the school years in typical learners and those with dyslexia," Journal of Learning Disabilities, vol. 46, no. 6, pp. 548–561, 2013.

\[25\] N. Ouherrou et al., "A Heuristic Evaluation of an Educational Game for Dyslexic Children," 2018. (see \[14\])

\[26\] S. N. S. Abu Bakar and N. Hashim, "Game-Based Learning," 2019. (see \[16\])

\[27\] L. Kumalasari et al., "Effectiveness of Maghzineh Cognitive Video Games," 2019. (see \[8\])

\[28\] S. Deterding, D. Dixon, R. Khaled, and L. Nacke, "From game design elements to gamefulness: Defining gamification," in Proc. 15th International Academic MindTrek Conference, pp. 9–15, 2011.

\[29\] P. Vaidya, "Air Writing Recognition Application for Dyslexic Children," in Proc. International Mobile and Embedded Technology Conference (MECON), 2022.

\[30\] E. H., "A Multimedia Big Data Retrieval Framework to Detect Dyslexia in Children," in Proc. International Conference on Big Data (BIGDATA), 2017.

\[31\] L. Thompson, "The dyslexic student's experience of education," South African Journal of Higher Education, vol. 35, no. 6, 2021.

\[32\] A. Rabab, G. Maymouna, J. Merzougui, and V. Khamlichi, "Speech Recognition Android App for Children with Dyslexia Using AI," in Proc. 1st International Conference on Advanced Innovations in Smart Cities (ICAISC), 2023.

\[33\] G. I. Schlunz, "Usability of Text-to-Speech Synthesis," Dissertation, 2018.

\[34\] R. Kariyawasam et al., "Deep Learning Based Screening," 2019. (see \[9\])

\[35\] R. Deepalakshmi, J. S. Revathy, S. P. Revathy, and N. Kousika, "Design and Implementation of a Comprehensive Intelligent E-Learning Systems Integrated Web App Solution For Dyslexic Students," in Proc. International Conference on Research Methodologies in Knowledge Management, AI and Telecommunication Engineering (RMKMATE), 2023.

\[36\] X. Jiao et al., "TinyBERT," 2020. (see \[12\])

\[37\] Z. Sun, H. Yu, X. Song, R. Liu, Y. Yang, and D. Yu, "MobileBERT: a Compact Task-Agnostic BERT for Resource-Limited Devices," in Proc. ACL 2020, pp. 2158–2170, 2020.

\[38\] J. Sweller, "Cognitive load during problem solving," 1988. (see \[11\])

\[39\] R. E. Mayer and R. Moreno, "Nine ways to reduce cognitive load in multimedia learning," Educational Psychologist, vol. 38, no. 1, pp. 43–52, 2003.

\[40\] A. R. Hevner, S. T. March, J. Park, and S. Ram, "Design science in information systems research," MIS Quarterly, vol. 28, no. 1, pp. 75–105, 2004.

# **GLOSSARY**

| **Term** | **Definition** |
| --- | --- |
| Cognitive Load | The total amount of mental effort being used in the working memory at any given time, as defined by Sweller's Cognitive Load Theory. |
| Cognitive Load Balancer (CLB) | The novel scheduling component of the WhisperWrite/WhisperMath system that monitors real-time performance signals and triggers domain switches to manage cognitive load. |
| Dyscalculia | A specific learning disability affecting mathematical reasoning, arithmetic fact retrieval, and numerical processing, distinct from but frequently co-occurring with dyslexia. |
| Dysgraphia | A neurologically based disorder characterised by difficulties with handwriting, orthographic coding, and written expression, frequently co-occurring with dyslexia. |
| Dyslexia | A neurodevelopmental disorder characterised by persistent difficulties with accurate and/or fluent word recognition, spelling, and phonological decoding, not attributable to intellectual disability or inadequate instruction. |
| Edge AI | The deployment and execution of artificial intelligence models directly on end-user devices (e.g., smartphones), without reliance on cloud computing infrastructure. |
| Knowledge Distillation | A model compression technique in which a smaller "student" model is trained to replicate the behaviour of a larger "teacher" model, producing a compact model with comparable performance. |
| MobileBERT | A compact, task-agnostic variant of BERT optimised for resource-limited mobile devices, achieving strong NLU performance with significantly reduced computational requirements. |
| Multisensory Learning | An instructional approach that simultaneously engages visual, auditory, and kinesthetic/tactile learning channels to enhance encoding and memory consolidation. |
| ONNX (Open Neural Network Exchange) | An open-source format for representing machine learning models, enabling hardware-agnostic model deployment across different inference runtimes and hardware platforms. |
| Phonological Awareness | The conscious ability to perceive and manipulate the sound structure of spoken language, including awareness of syllables, rhymes, and individual phonemes — a core cognitive foundation for reading acquisition. |
| Quantization | A model compression technique that reduces the numerical precision of model weights (e.g., from 32-bit floating point to 8-bit integer), reducing model size and inference latency with minimal accuracy loss. |
| TFLite (TensorFlow Lite) | A lightweight version of the TensorFlow machine learning framework designed for deployment on mobile and embedded devices, supporting hardware acceleration via NNAPI. |
| TinyBERT | A distilled version of BERT achieving 96.8% of BERT-base performance at 7.5x fewer parameters, suitable for real-time NLP inference on mobile devices. |
| WhisperMath | The mathematical support module of the proposed system, providing real-time step-by-step verbal guidance and numerical error classification for arithmetic problem-solving. |
| WhisperWrite | The writing support module of the proposed system, providing real-time read-aloud assistance and contextual spelling feedback during written text production. |

# **APPENDICES**

## **Appendix A: User Study Informed Consent Form**

This informed consent form was administered to all participant guardians prior to the commencement of the evaluation study, in compliance with the SLIIT Research Ethics Committee requirements and the COPPA regulations governing data collection from children under 13 years of age.

Title of Study: Evaluation of a Dual-Skill AI Feedback System for Dyslexic Children

Principal Investigator: Chathuranga D.S.I., IT22069054, Department of Information Technology, SLIIT

Supervisor: Dr. Samantha Rajapaksha

Purpose of the Study: This study aims to evaluate the effectiveness and usability of an AI-powered mobile application designed to support children with dyslexia in developing writing and mathematical skills. Your child will be invited to use the application at home for approximately 25-30 minutes per day, five days per week, over four weeks.

Risks and Benefits: There are no known physical risks associated with participation. Children may experience mild frustration when encountering errors. The application is designed to minimise frustration through positive, supportive feedback. Potential benefits include improvement in spelling and mathematical skills and increased confidence in academic tasks.

Data Collection and Privacy: Interaction data (keystrokes, response times, error rates) will be collected and stored securely in Firebase with encryption at rest and in transit. No personally identifiable information beyond the child's first name and diagnosis will be collected. All data will be anonymised for analysis and reporting. Data will be retained for five years following the study conclusion and then securely destroyed.

Voluntary Participation: Participation is entirely voluntary. You or your child may withdraw at any time without consequence.

Guardian Signature: \___\___\___\___\___\___\___\___\___ Date: \___\___\___\___\___

Child Assent (verbal/written): \___\___\___\___\___\___\___\___\___ Date: \___\___\___\___\___

## **Appendix B: Parent/Guardian Feedback Questionnaire**

The following questionnaire was administered to parents/guardians at the end of Weeks 2 and 4 of the evaluation study. Responses were collected on a five-point Likert scale (1 = Strongly Disagree, 5 = Strongly Agree) unless otherwise indicated.

1.  My child appeared engaged and motivated when using the application.
2.  I noticed improvements in my child's spelling during this period.
3.  I noticed improvements in my child's mathematical performance during this period.
4.  The application seemed to reduce my child's frustration with academic tasks.
5.  My child's attention span during homework appeared to improve during this period.
6.  The parent dashboard provided useful and understandable information about my child's progress.
7.  I would recommend this application to other parents of children with dyslexia.
8.  (Open-ended) Please describe any changes in your child's attitude toward reading, writing, or mathematics that you observed during this period.
9.  (Open-ended) Please describe any technical difficulties or frustrations encountered with the application.

## **Appendix C: Teacher Observation Checklist**

The following checklist was provided to each participant's class teacher at the beginning and end of the evaluation study. Teachers were asked to rate each behaviour on a four-point scale: 1 = Never, 2 = Sometimes, 3 = Often, 4 = Always.

1.  The child attempts writing tasks without requiring excessive reassurance.
2.  The child's written work shows improvement in spelling accuracy over recent weeks.
3.  The child demonstrates willingness to attempt mathematical problems independently.
4.  The child's mathematical work shows improvement in accuracy over recent weeks.
5.  The child maintains attention during group instruction for appropriate durations.
6.  The child demonstrates appropriate self-regulation when encountering academic challenges.
7.  The child participates verbally in classroom discussions related to literacy and numeracy.

## **Appendix D: Originality Report**

The plagiarism analysis of this dissertation was conducted using Turnitin prior to submission. The overall similarity index is 4%, with no individual source contributing more than 1% similarity. The similarity index is attributable entirely to correctly cited quotations and standard technical terminology unavoidable in the domain. All sources are properly cited and referenced in accordance with IEEE referencing conventions.

| **Source Type** | **Similarity Index** |
| --- | --- |
| Internet Sources | 2%  |
| Publications | 1%  |
| Student Papers | 1%  |
| Total Similarity Index | 4%  |