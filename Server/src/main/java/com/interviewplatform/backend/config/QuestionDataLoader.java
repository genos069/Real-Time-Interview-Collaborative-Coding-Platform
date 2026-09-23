package com.interviewplatform.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewplatform.backend.importer.dto.ExampleJson;
import com.interviewplatform.backend.importer.dto.ProblemJson;
import com.interviewplatform.backend.model.*;
import com.interviewplatform.backend.repository.QuestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import com.interviewplatform.backend.importer.parser.JavaSignatureParser;
import com.interviewplatform.backend.importer.parser.ExampleParser;

import java.util.ArrayList;
import java.util.List;

@Component
public class QuestionDataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(QuestionDataLoader.class);

    private final QuestionRepository questionRepository;
    private final ObjectMapper objectMapper;
    private final JavaSignatureParser javaSignatureParser;
    private final ExampleParser exampleParser;

    public QuestionDataLoader(
            QuestionRepository questionRepository,
            ObjectMapper objectMapper,
            JavaSignatureParser javaSignatureParser,
            ExampleParser exampleParser
    ) {
        this.questionRepository = questionRepository;
        this.objectMapper = objectMapper;
        this.javaSignatureParser = javaSignatureParser;
        this.exampleParser = exampleParser;
    }

    @Override
    public void run(String... args) throws Exception {

        if (questionRepository.count() > 0) {
            log.info("Questions already exist in database. Skipping dataset import.");
            return;
        }

        PathMatchingResourcePatternResolver resolver =
                new PathMatchingResourcePatternResolver();

        Resource[] resources =
                resolver.getResources("classpath:dataset/problems/*.json");

        for (Resource resource : resources) {

            try {

                ProblemJson json =
                        objectMapper.readValue(resource.getInputStream(), ProblemJson.class);

                Question question = new Question();

                question.setExternalProblemId(json.getProblemId());
                question.setSlug(json.getProblemSlug());

                question.setTitle(json.getTitle());
                question.setDescription(json.getDescription());

                question.setDifficulty(
                        Difficulty.valueOf(json.getDifficulty().toUpperCase())
                );

                if (json.getTopics() != null && !json.getTopics().isEmpty()) {

                    question.setCategory(json.getTopics().get(0));
                    question.setTags(json.getTopics());

                }

                question.setConstraints(json.getConstraints());

                StarterCode starterCode = new StarterCode();

                if (json.getCodeSnippets() != null) {

                    starterCode.setJava(json.getCodeSnippets().getJava());
                    starterCode.setCpp(json.getCodeSnippets().getCpp());
                    starterCode.setJavascript(json.getCodeSnippets().getJavascript());
                    starterCode.setPython(json.getCodeSnippets().getPython3());

                }

                question.setStarterCode(starterCode);

                // Execution Metadata
                if (starterCode.getJava() != null) {
                    question.setExecutionMetadata(
                            javaSignatureParser.parse(starterCode.getJava())
                    );
                }

                List<Example> examples = new ArrayList<>();

                if (json.getExamples() != null) {

                    for (ExampleJson exampleJson : json.getExamples()) {

                        Example example = new Example();

                        String text = exampleJson.getExampleText();

                        String input = "";
                        String output = "";
                        String explanation = "";

                        if (text.contains("Input:")) {

                            int start = text.indexOf("Input:") + 6;

                            int end = text.contains("Output:")
                                    ? text.indexOf("Output:")
                                    : text.length();

                            input = text.substring(start, end).trim();
                        }

                        if (text.contains("Output:")) {

                            int start = text.indexOf("Output:") + 7;

                            int end = text.contains("Explanation:")
                                    ? text.indexOf("Explanation:")
                                    : text.length();

                            output = text.substring(start, end).trim();
                        }

                        if (text.contains("Explanation:")) {

                            explanation =
                                    text.substring(text.indexOf("Explanation:") + 12).trim();
                        }

                        example.setInput(input);
                        example.setOutput(output);
                        example.setExplanation(explanation);

                        examples.add(example);

                    }

                }

                question.setExamples(examples);

                // Generate Test Cases From Examples
                question.setTestCases(
                        exampleParser.parse(examples)
                );

                question.setEstimatedTime(15);

                questionRepository.save(question);

            } catch (Exception e) {

                log.error("Failed to import problem from {}: {}", resource.getFilename(), e.getMessage());

            }

        }

        log.info("Dataset import complete. Total questions: {}", questionRepository.count());

    }

}