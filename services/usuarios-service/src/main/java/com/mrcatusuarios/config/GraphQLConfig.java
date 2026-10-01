package com.mrcatusuarios.config;

import graphql.GraphQLContext;
import graphql.GraphQLError;
import graphql.schema.DataFetchingEnvironment;
import graphql.language.StringValue;
import graphql.schema.Coercing;
import graphql.schema.GraphQLScalarType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.RuntimeWiringConfigurer;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Configuration
public class GraphQLConfig {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Bean
    public RuntimeWiringConfigurer dateTimeScalarConfigurer() {
        GraphQLScalarType dateTime = GraphQLScalarType.newScalar()
            .name("DateTime")
            .description("Fecha y hora en formato ISO-8601")
            .coercing(new Coercing<LocalDateTime, String>() {
                @Override
                public String serialize(Object dataFetcherResult, GraphQLContext context, Locale locale) {
                    return ((LocalDateTime) dataFetcherResult).format(FORMATTER);
                }

                @Override
                public LocalDateTime parseValue(Object input, GraphQLContext context, Locale locale) {
                    return LocalDateTime.parse(input.toString(), FORMATTER);
                }

                @Override
                public LocalDateTime parseLiteral(Object input) {
                    if (input instanceof StringValue valor) {
                        return LocalDateTime.parse(valor.getValue(), FORMATTER);
                    }
                    return null;
                }
            })
            .build();
        return wiring -> wiring.scalar(dateTime);
    }

    @Bean
    public DataFetcherExceptionResolverAdapter exceptionResolver() {
        return new DataFetcherExceptionResolverAdapter() {
            @Override
            protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment environment) {
                return GraphQLError.newError().message(ex.getMessage()).build();
            }
        };
    }
}
